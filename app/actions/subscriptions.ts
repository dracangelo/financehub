"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function getSubscriptions() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createClient()

    const { data: subscriptions, error } = await supabase
      .from("user_bills")
      .select(`
        *,
        biller:biller_id (
          id,
          name,
          category,
          website_url,
          support_contact
        )
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("next_payment_date", { ascending: true })

    if (error) {
      console.error("Error fetching subscriptions:", error)
      throw error
    }

    if (!subscriptions) {
      return []
    }

    return subscriptions
  } catch (error) {
    console.error("Error in getSubscriptions:", error)
    throw error
  }
}

export async function getSubscriptionById(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createClient()

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        categories:category_id (id, name, color),
        payment_methods:payment_method_id (id, name, type)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching subscription:", error)
      throw new Error("Failed to fetch subscription")
    }

    // Get subscription history
    const { data: history, error: historyError } = await supabase
      .from("subscription_history")
      .select("*")
      .eq("subscription_id", id)
      .order("change_date", { ascending: false })

    if (historyError) {
      console.error("Error fetching subscription history:", historyError)
    }

    // Get subscription usage
    const { data: usage, error: usageError } = await supabase
      .from("subscription_usage")
      .select("*")
      .eq("subscription_id", id)
      .order("usage_date", { ascending: false })

    if (usageError) {
      console.error("Error fetching subscription usage:", usageError)
    }

    return {
      subscription,
      history: history || [],
      usage: usage || [],
    }
  } catch (error) {
    console.error("Error in getSubscriptionById:", error)
    throw new Error("Failed to fetch subscription")
  }
}

export async function createSubscription(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createClient()

    // Extract form data
    const name = formData.get("name") as string | null
    const provider = formData.get("provider") as string | null
    const amountValue = formData.get("amount")
    const amount = amountValue ? Number(amountValue) : 0
    
    // Get values with defaults for required fields
    let billing_frequency = formData.get("billing_cycle") as string | null || formData.get("billing_frequency") as string | null
    if (!billing_frequency) {
      billing_frequency = "monthly"
    }
    
    // Normalize billing frequency values
    if (billing_frequency === "bi-weekly" || billing_frequency === "biweekly") {
      billing_frequency = "biweekly"
    } else if (billing_frequency === "semi-annually" || billing_frequency === "semiannually") {
      billing_frequency = "semi-annually"
    }
    
    // Set start date to today if not provided
    let start_date = formData.get("start_date") as string | null
    if (!start_date) {
      start_date = new Date().toISOString().split('T')[0]
    }
    
    // Set next payment date to 1 month from today if not provided
    let next_payment_date = formData.get("next_payment_date") as string | null
    if (!next_payment_date) {
      const today = new Date()
      today.setMonth(today.getMonth() + 1) // Add 1 month
      next_payment_date = today.toISOString().split('T')[0]
    }
    
    const payment_method = formData.get("payment_method") as string | null
    const auto_pay = formData.get("auto_pay") === "true"
    let type = formData.get("type") as string | null
    if (!type) {
      type = "subscription"
    }
    const usage_value = formData.get("usage_value") ? Number(formData.get("usage_value")) : null

    // Validate required fields with specific error messages
    const validationErrors: string[] = []
    
    if (!name?.trim()) validationErrors.push("Name is required")
    if (!provider?.trim()) validationErrors.push("Provider is required")
    if (!amount || isNaN(amount) || amount <= 0) validationErrors.push("Valid amount is required")
    
    // Since we've provided defaults, these should no longer trigger validation errors
    // but we'll keep the validation code in case the defaults somehow fail
    if (!billing_frequency?.trim()) validationErrors.push("Billing frequency is required")
    if (!start_date?.trim()) validationErrors.push("Start date is required")
    if (!next_payment_date?.trim()) validationErrors.push("Next payment date is required")
    
    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (start_date && !dateRegex.test(start_date)) validationErrors.push("Start date must be in YYYY-MM-DD format")
    if (next_payment_date && !dateRegex.test(next_payment_date)) validationErrors.push("Next payment date must be in YYYY-MM-DD format")
    
    if (validationErrors.length > 0) {
      throw new Error(`Missing or invalid fields: ${validationErrors.join(", ")}`)
    }

    // First, create or get the biller
    const { data: biller, error: billerError } = await supabase
      .from("billers")
      .select("id")
      .eq("name", provider)
      .single()

    let biller_id: string
    if (billerError || !biller) {
      // Create new biller if it doesn't exist
      const { data: newBiller, error: newBillerError } = await supabase
        .from("billers")
        .insert({
          name: provider,
          category: formData.get("category_id") as string || formData.get("category") as string || null,
          website_url: formData.get("website_url") as string || null,
          support_contact: formData.get("support_contact") as string || null
        })
        .select("id")
        .single()

      if (newBillerError) {
        console.error("Error creating biller:", newBillerError)
        throw newBillerError
      }
      biller_id = newBiller.id
    } else {
      biller_id = biller.id
    }

    // Create subscription in user_bills table
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_bills")
      .insert({
        user_id: user.id,
        biller_id,
        name,
        type,
        amount,
        billing_frequency,
        start_date,
        next_payment_date,
        payment_method,
        auto_pay,
        usage_value,
        is_active: true,
        category: formData.get("category_id") as string || formData.get("category") as string || null
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError)
      throw subscriptionError
    }

    // Revalidate the subscriptions page
    revalidatePath("/subscriptions")

    return subscription
  } catch (error) {
    console.error("Error in createSubscription:", error)
    throw error
  }
}

export async function updateSubscription(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createClient()

    const name = formData.get("name") as string
    const provider = formData.get("provider") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    
    // Get and normalize billing cycle
    let billing_cycle = (formData.get("billing_cycle") as string) || "monthly"
    
    // Normalize billing frequency values
    if (billing_cycle === "bi-weekly" || billing_cycle === "biweekly") {
      billing_cycle = "biweekly"
    } else if (billing_cycle === "semi-annually" || billing_cycle === "semiannually") {
      billing_cycle = "semi-annually"
    }
    
    const start_date = formData.get("start_date") as string
    const next_billing_date = formData.get("next_billing_date") as string
    const category_id = (formData.get("category_id") as string) || null
    const payment_method_id = (formData.get("payment_method_id") as string) || null
    const auto_renew = formData.get("auto_renew") === "true"
    const status = (formData.get("status") as string) || "active"
    const cancellation_url = (formData.get("cancellation_url") as string) || null
    const usage_frequency = (formData.get("usage_frequency") as string) || "medium"
    const notes = (formData.get("notes") as string) || ""

    // First, try to update in the subscriptions table
    try {
      // Get current subscription to check for changes
      const { data: currentSub, error: fetchError } = await supabase
        .from("subscriptions")
        .select("amount, billing_cycle")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (!fetchError && currentSub) {
        const { data: subscription, error } = await supabase
          .from("subscriptions")
          .update({
            name,
            provider,
            amount,
            billing_cycle,
            start_date,
            next_billing_date,
            category_id,
            payment_method_id,
            auto_renew,
            status,
            cancellation_url,
            usage_frequency,
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single()

        if (error) {
          console.error("Error updating subscription:", error)
          throw new Error("Failed to update subscription")
        }

        // Create subscription history entry if amount or billing cycle changed
        if (currentSub.amount !== amount || currentSub.billing_cycle !== billing_cycle) {
          await supabase.from("subscription_history").insert({
            subscription_id: id,
            amount,
            billing_cycle,
            change_date: new Date().toISOString().split("T")[0],
            notes: "Subscription details updated",
          })
        }

        revalidatePath("/subscriptions")
        return subscription
      }
    } catch (err) {
      console.log("Not found in subscriptions table, trying user_bills")
    }

    // If we get here, try updating in the user_bills table
    try {
      // First, get the current user_bill to see what fields exist
      const { data: currentBill, error: fetchBillError } = await supabase
        .from("user_bills")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()
      
      if (fetchBillError) {
        console.error("Error fetching user bill:", fetchBillError)
        throw new Error("Failed to update subscription")
      }
      
      // Build update object based on existing columns
      const updateData: Record<string, any> = {
        name,
        amount
      }
      
      // Handle biller_id (provider) update
      if (provider) {
        // Check if this provider/biller already exists
        const { data: existingBiller } = await supabase
          .from("billers")
          .select("id")
          .eq("name", provider)
          .maybeSingle()
          
        if (existingBiller) {
          // Use existing biller
          updateData.biller_id = existingBiller.id
        } else {
          // Create new biller with category if provided
          const { data: newBiller, error: billerError } = await supabase
            .from("billers")
            .insert({
              name: provider,
              category: category_id // Use category_id as the category name
            })
            .select()
            .single()
            
          if (!billerError && newBiller) {
            updateData.biller_id = newBiller.id
          }
        }
      }
      
      // Map billing_cycle to valid billing_frequency values according to the schema constraint
      // check (billing_frequency in ('monthly', 'quarterly', 'yearly', 'weekly'))
      let mappedBillingFrequency = 'monthly';
      switch (billing_cycle) {
        case 'weekly':
          mappedBillingFrequency = 'weekly';
          break;
        case 'biweekly':
          mappedBillingFrequency = 'weekly'; // closest match
          break;
        case 'monthly':
          mappedBillingFrequency = 'monthly';
          break;
        case 'quarterly':
          mappedBillingFrequency = 'quarterly';
          break;
        case 'semiannually':
          mappedBillingFrequency = 'quarterly'; // closest match
          break;
        case 'annually':
        case 'yearly':
          mappedBillingFrequency = 'yearly';
          break;
        default:
          mappedBillingFrequency = 'monthly';
      }
      
      // Only add fields that exist in the table - using the actual schema from bill.sql
      if ('billing_frequency' in currentBill) updateData.billing_frequency = mappedBillingFrequency
      if ('next_payment_date' in currentBill) updateData.next_payment_date = next_billing_date
      if ('start_date' in currentBill) updateData.start_date = start_date
      if ('is_active' in currentBill) updateData.is_active = status === "active"
      if ('auto_pay' in currentBill) updateData.auto_pay = auto_renew
      if ('payment_method' in currentBill) updateData.payment_method = payment_method_id
      if ('usage_value' in currentBill) updateData.usage_value = usage_frequency === 'high' ? 8 : usage_frequency === 'medium' ? 5 : 2
      if ('notes' in currentBill) updateData.notes = notes
      
      const { data: userBill, error: userBillError } = await supabase
        .from("user_bills")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (userBillError) {
        console.error("Error updating user bill:", userBillError)
        throw new Error("Failed to update subscription")
      }

      revalidatePath("/subscriptions")
      return userBill
    } catch (err) {
      console.error("Error updating in user_bills table:", err)
      throw new Error("Failed to update subscription")
    }
  } catch (error) {
    console.error("Error in updateSubscription:", error)
    throw new Error("Failed to update subscription")
  }
}

export async function deleteSubscription(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createClient()
    let success = false;

    // First try to delete from subscriptions table
    try {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
      
      if (!error) {
        success = true;
        console.log("Successfully deleted from subscriptions table");
      }
    } catch (subError) {
      console.log("Item not found in subscriptions table or other error:", subError);
      // Continue to try user_bills table
    }

    // Then try to delete from user_bills table
    try {
      const { error } = await supabase
        .from("user_bills")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
      
      if (!error) {
        success = true;
        console.log("Successfully deleted from user_bills table");
      }
    } catch (billError) {
      console.log("Item not found in user_bills table or other error:", billError);
      // If we haven't succeeded in either table, we'll throw an error below
    }

    if (!success) {
      throw new Error("Failed to delete subscription from any table");
    }

    revalidatePath("/subscriptions")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteSubscription:", error)
    throw new Error("Failed to delete subscription")
  }
}

export async function recordSubscriptionUsage(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createClient()

    const usage_date = (formData.get("usage_date") as string) || new Date().toISOString().split("T")[0]
    const duration_minutes = Number.parseInt(formData.get("duration_minutes") as string) || 0
    const usage_value = Number.parseInt(formData.get("usage_value") as string) || 5
    const notes = (formData.get("notes") as string) || ""

    const { data, error } = await supabase
      .from("subscription_usage")
      .insert({
        subscription_id: id,
        usage_date,
        duration_minutes,
        usage_value,
        notes,
      })
      .select()
      .single()

    if (error) {
      console.error("Error recording subscription usage:", error)
      throw new Error("Failed to record subscription usage")
    }

    // Update subscription usage_frequency based on recent usage patterns
    const { data: usageData } = await supabase
      .from("subscription_usage")
      .select("*")
      .eq("subscription_id", id)
      .order("usage_date", { ascending: false })
      .limit(10)

    if (usageData && usageData.length > 0) {
      const avgUsageValue = usageData.reduce((sum, item) => sum + item.usage_value, 0) / usageData.length
      let usage_frequency = "medium"

      if (avgUsageValue > 7) {
        usage_frequency = "high"
      } else if (avgUsageValue < 4) {
        usage_frequency = "low"
      }

      await supabase.from("subscriptions").update({ usage_frequency }).eq("id", id).eq("user_id", user.id)
    }

    revalidatePath(`/subscriptions/${id}`)
    return data
  } catch (error) {
    console.error("Error in recordSubscriptionUsage:", error)
    throw new Error("Failed to record subscription usage")
  }
}

export async function getSubscriptionROI() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createClient()
    
    // Define interface for subscription data
    interface SubscriptionData {
      id: string;
      name: string;
      provider: string;
      category?: string;
      amount: number;
      billing_cycle: string;
      usage_frequency: string;
      auto_renew?: boolean;
      payment_method?: string;
    }
    
    let allSubscriptions: SubscriptionData[] = [];

    // First try to get subscriptions from user_bills table
    const { data: userBills, error: userBillsError } = await supabase
      .from("user_bills")
      .select(`
        id,
        name,
        biller:biller_id (name, category),
        amount,
        billing_frequency,
        usage_value,
        auto_pay,
        payment_method,
        next_payment_date
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (userBillsError) {
      console.error("Error fetching user_bills for ROI:", userBillsError)
    } else {
      // Map user_bills to match the subscriptions structure
      const formattedUserBills = userBills.map(bill => {
        // Ensure we handle the biller object correctly
        let billerName = null;
        let billerCategory = null;
        
        if (bill.biller) {
          // Handle different possible shapes of the biller object
          if (typeof bill.biller === 'object') {
            if (Array.isArray(bill.biller)) {
              // If it's an array, take the first item
              if (bill.biller.length > 0) {
                const firstBiller = bill.biller[0] as any;
                billerName = firstBiller?.name || null;
                billerCategory = firstBiller?.category || null;
              }
            } else {
              // It's a regular object
              // Use type assertion to avoid TypeScript errors
              const billerObj = bill.biller as any;
              billerName = billerObj?.name || null;
              billerCategory = billerObj?.category || null;
            }
          }
        }
        
        return {
          id: bill.id,
          name: bill.name,
          provider: billerName || 'Unknown',
          category: billerCategory || 'Uncategorized',
          amount: bill.amount,
          billing_cycle: bill.billing_frequency || 'monthly',
          usage_frequency: typeof bill.usage_value === 'number' ? 
            (bill.usage_value > 6 ? 'high' : bill.usage_value > 3 ? 'medium' : 'low') : 'medium',
          auto_renew: bill.auto_pay || false,
          payment_method: bill.payment_method || 'Unknown'
        } as SubscriptionData;
      })
      
      allSubscriptions = formattedUserBills
    }
    
    // Try to get data from subscriptions table as well if it exists
    try {
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          name,
          provider,
          amount,
          billing_cycle,
          usage_frequency
        `)
        .eq("user_id", user.id)
        .eq("status", "active")

      if (!error && subscriptions) {
        // Add subscriptions to the list with proper type handling
        const typedSubscriptions = subscriptions.map(sub => ({
          id: sub.id,
          name: sub.name,
          provider: sub.provider || 'Unknown',
          amount: sub.amount,
          billing_cycle: sub.billing_cycle || 'monthly',
          usage_frequency: sub.usage_frequency || 'medium'
        } as SubscriptionData));
        
        allSubscriptions = [...allSubscriptions, ...typedSubscriptions];
      }
    } catch (subError) {
      // Silently handle this error since we already have user_bills data
      console.log("Subscriptions table may not exist, continuing with user_bills data")
    }
    
    // If we have no data at all, throw an error
    if (allSubscriptions.length === 0) {
      throw new Error("No subscription data found")
    }

    // Calculate monthly cost for each subscription
    const subscriptionsWithROI = await Promise.all(
      allSubscriptions.map(async (sub) => {
        let monthlyAmount = sub.amount

        // Convert to monthly amount based on billing cycle
        switch (sub.billing_cycle) {
          case "weekly":
            monthlyAmount = sub.amount * 4.33 // Average weeks in a month
            break
          case "biweekly":
            monthlyAmount = sub.amount * 2.17 // Average bi-weeks in a month
            break
          case "quarterly":
            monthlyAmount = sub.amount / 3
            break
          case "semiannually":
            monthlyAmount = sub.amount / 6
            break
          case "annually":
            monthlyAmount = sub.amount / 12
            break
        }

        // Get usage data for this subscription
        const { data: usageData } = await supabase
          .from("subscription_usage")
          .select("usage_value, duration_minutes")
          .eq("subscription_id", sub.id)
          .order("usage_date", { ascending: false })
          .limit(10)
        
        // Define the usage data interface
        interface UsageData {
          usage_value?: number;
          duration_minutes?: number;
        }

        // Calculate ROI metrics
        let usageScore = 5 // Default medium usage
        let usageHours = 0
        let monthlyAmountValid = sub.amount || 0

        if (!monthlyAmountValid || monthlyAmountValid < 0) {
          throw new Error("Invalid subscription amount")
        }

        if (usageData && usageData.length > 0) {
          usageScore = usageData.reduce((sum, item: UsageData) => sum + (item.usage_value || 0), 0) / usageData.length
          usageHours = usageData.reduce((sum, item: UsageData) => sum + ((item.duration_minutes || 0) / 60), 0)
        } else {
          // Estimate based on usage_frequency if no specific data
          switch (sub.usage_frequency) {
            case "low":
              usageScore = 3
              usageHours = 2
              break
            case "medium":
              usageScore = 5
              usageHours = 8
              break
            case "high":
              usageScore = 8
              usageHours = 20
              break
          }
        }

        // Calculate value metrics
        const costPerUse = usageData && usageData.length > 0 ? monthlyAmount / Math.max(1, usageData.length) : monthlyAmount

        const costPerHour = monthlyAmount / Math.max(1, usageHours)

        // Calculate ROI score (0-100)
        // Higher usage score and lower cost per use = better ROI
        const roiScore = Math.min(100, Math.max(0, (usageScore * 10) - (costPerUse * 2) + (50 - costPerHour)))

        // Determine if this is a good value
        const valueCategory = roiScore >= 70 ? "good" : roiScore >= 40 ? "average" : "poor"

        // Recommendation based on ROI
        let recommendation = ""
        if (valueCategory === "poor") {
          recommendation = "Consider cancelling this subscription or finding ways to use it more frequently."
        } else if (valueCategory === "average") {
          recommendation = "Look for ways to maximize the value of this subscription or consider alternatives."
        } else {
          recommendation = "This subscription provides good value. Continue using it regularly."
        }

        return {
          ...sub,
          monthlyAmount,
          usageScore,
          usageHours,
          costPerUse,
          costPerHour,
          roiScore,
          valueCategory,
          recommendation,
        }
      }),
    )

    // Sort by ROI score (worst to best)
    return subscriptionsWithROI.sort((a, b) => a.roiScore - b.roiScore)
  } catch (error) {
    console.error("Error in getSubscriptionROI:", error)
    throw new Error("Failed to calculate subscription ROI")
  }
}

export async function findDuplicateServices() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createClient()
    
    // Define subscription interface to match both data structures
    interface SubscriptionData {
      id: string;
      name: string;
      provider?: string;
      biller?: {
        name?: string;
        category?: string;
      };
      amount: number;
      billing_cycle?: string;
      billing_frequency?: string;
      payment_cycle?: string;
      categories?: {
        name?: string;
      };
    }
    
    let allSubscriptions: SubscriptionData[] = [];
    
    // First, try to get data from user_bills table
    const { data: userBills, error: userBillsError } = await supabase
      .from("user_bills")
      .select(`
        id,
        name,
        biller:biller_id (name, category),
        amount,
        billing_frequency
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
    
    if (!userBillsError && userBills) {
      // Map user_bills to the common format
      const formattedUserBills = userBills.map(bill => {
        // Handle biller object correctly
        let billerName = null;
        let billerCategory = null;
        
        if (bill.biller) {
          if (typeof bill.biller === 'object') {
            if (Array.isArray(bill.biller)) {
              if (bill.biller.length > 0) {
                const firstBiller = bill.biller[0] as any;
                billerName = firstBiller?.name || null;
                billerCategory = firstBiller?.category || null;
              }
            } else {
              // Use type assertion to avoid TypeScript errors
              const billerObj = bill.biller as any;
              billerName = billerObj?.name || null;
              billerCategory = billerObj?.category || null;
            }
          }
        }
        
        return {
          id: bill.id,
          name: bill.name,
          provider: billerName,
          biller: {
            name: billerName,
            category: billerCategory
          },
          amount: bill.amount,
          billing_cycle: bill.billing_frequency
        } as SubscriptionData;
      });
      
      allSubscriptions = [...allSubscriptions, ...formattedUserBills];
    }
    
    // Then try to get data from subscriptions table
    try {
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          name,
          provider,
          category_id,
          amount,
          billing_cycle,
          categories:category_id (name)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")

      if (!error && subscriptions) {
        // Add subscriptions to the list
        allSubscriptions = [...allSubscriptions, ...subscriptions as SubscriptionData[]];
      }
    } catch (subError) {
      console.log("Error fetching from subscriptions table or table doesn't exist");
      // Continue with user_bills data
    }
    
    // If we have no data from either table, throw an error
    if (allSubscriptions.length === 0) {
      throw new Error("No subscription data found");
    }

    // We've already defined the SubscriptionData interface above

    // Group subscriptions by category
    const subscriptionsByCategory = allSubscriptions.reduce<Record<string, SubscriptionData[]>>((acc, sub) => {
      // Use type assertion to avoid TypeScript errors
      const categoryObj = sub.categories as any;
      const billerObj = sub.biller as any;
      const categoryName = categoryObj?.name || billerObj?.category || "Uncategorized"
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(sub)
      return acc
    }, {})

    // Find potential duplicates within each category
    const potentialDuplicates = []

    for (const category in subscriptionsByCategory) {
      const subs = subscriptionsByCategory[category] as SubscriptionData[]

      // Only check categories with multiple subscriptions
      if (subs.length > 1) {
        // Check for streaming services
        if (category.toLowerCase().includes("streaming") || category.toLowerCase().includes("entertainment")) {
          potentialDuplicates.push({
            category,
            subscriptions: subs,
            reason: "Multiple streaming services detected",
            recommendation: "Consider consolidating to fewer streaming platforms or rotating subscriptions monthly",
          })
        }

        // Check for similar service providers
        const providers = subs.map((s: SubscriptionData) => (s.provider || s.biller?.name || '').toLowerCase())
        const uniqueProviders = new Set(providers)

        if (providers.length > uniqueProviders.size) {
          // Find the duplicated providers
          const duplicatedProviders = providers.filter((item: string, index: number) => providers.indexOf(item) !== index)

          for (const provider of duplicatedProviders) {
            const duplicateSubs = subs.filter((s: SubscriptionData) => (s.provider || s.biller?.name || '').toLowerCase() === provider)
            potentialDuplicates.push({
              category,
              subscriptions: duplicateSubs,
              reason: `Multiple subscriptions from ${provider}`,
              recommendation: "Check if these services can be bundled or if one can be eliminated",
            })
          }
        }

        // Check for potentially overlapping services
        if (subs.length >= 3) {
          potentialDuplicates.push({
            category,
            subscriptions: subs,
            reason: `Multiple services in ${category} category`,
            recommendation: "Review if all these services are necessary or if some have overlapping features",
          })
        }
      }
    }

    return potentialDuplicates
  } catch (error) {
    console.error("Error in findDuplicateServices:", error)
    throw new Error("Failed to find duplicate services")
  }
}

export async function optimizePaymentSchedule() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect('/login')
    }

    const supabase = await createClient()
    
    // Get all bills and subscriptions
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('id, name, amount, due_date, is_recurring, recurrence_pattern')
      .eq('user_id', user.id)
      .eq('status', 'pending')
    
    if (billsError) {
      console.error('Error fetching bills:', billsError)
      throw new Error('Failed to optimize payment schedule')
    }
    
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('id, name, amount, next_billing_date, billing_cycle')
      .eq('user_id', user.id)
      .eq('status', 'active')
    
    if (subsError) {
      console.error('Error fetching subscriptions:', subsError)
      return []
    }
    
    return subscriptions
  } catch (error) {
    console.error("Error in optimizePaymentSchedule:", error)
    throw new Error("Failed to optimize payment schedule")
  }
}

export async function calculateSubscriptionROI(subscriptionId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect('/login')
    }

    const supabase = await createClient()
    
    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, name, amount, billing_cycle')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single()
    
    if (subError) {
      console.error('Error fetching subscription:', subError)
      throw new Error('Failed to calculate subscription ROI')
    }
    
    let monthlyAmount = subscription.amount
    
    // Convert to monthly amount based on billing cycle
    switch (subscription.billing_cycle) {
      case 'weekly':
        monthlyAmount = subscription.amount * 4.33 // Average weeks in a month
        break
      case 'biweekly':
        monthlyAmount = subscription.amount * 2.17 // Average bi-weeks in a month
        break
      case 'quarterly':
        monthlyAmount = subscription.amount / 3
        break
      case 'semiannually':
        monthlyAmount = subscription.amount / 6
        break
      case 'annually':
        monthlyAmount = subscription.amount / 12
        break
    }
    
    // Get usage data for this subscription
    const { data: usageData, error: usageError } = await supabase
      .from('subscription_usage')
      .select('usage_value, duration_minutes')
      .eq('subscription_id', subscriptionId)
      .order('usage_date', { ascending: false })
      .limit(10)
    
    if (usageError) {
      console.error('Error fetching subscription usage:', usageError)
      throw new Error('Failed to calculate subscription ROI')
    }
    
    // Calculate ROI metrics
    let usageScore = 5 // Default medium usage
    let usageHours = 0
    let monthlyAmountValid = subscription.amount || 0

    if (!monthlyAmountValid || monthlyAmountValid < 0) {
      throw new Error("Invalid subscription amount")
    }

    if (usageData && usageData.length > 0) {
      usageScore = usageData.reduce((sum, item) => sum + (item.usage_value || 0), 0) / usageData.length
      usageHours = usageData.reduce((sum, item) => sum + ((item.duration_minutes || 0) / 60), 0)
    }
    
    // Calculate value metrics
    const costPerUse = usageData && usageData.length > 0 ? monthlyAmount / Math.max(1, usageData.length) : monthlyAmount

    const costPerHour = monthlyAmount / Math.max(1, usageHours)

    // Calculate ROI score (0-100)
    // Higher usage score and lower cost per use = better ROI
    const roiScore = Math.min(100, Math.max(0, (usageScore * 10) - (costPerUse * 2) + (50 - costPerHour)))
    
    // Determine if this is a good value
    const valueCategory = roiScore >= 70 ? 'good' : (roiScore >= 40 ? 'average' : 'poor')
    
    // Recommendation based on ROI
    let recommendation = ''
    if (valueCategory === 'poor') {
      recommendation = 'Consider cancelling this subscription or finding ways to use it more frequently.'
    } else if (valueCategory === 'average') {
      recommendation = 'Look for ways to maximize the value of this subscription or consider alternatives.'
    } else {
      recommendation = 'This subscription provides good value. Continue using it regularly.'
    }
    
    return {
      subscriptionId,
      monthlyAmount,
      usageScore,
      usageHours,
      costPerUse,
      costPerHour,
      roiScore,
      valueCategory,
      recommendation
    }
  } catch (error) {
    console.error('Error in calculateSubscriptionROI:', error)
    throw new Error('Failed to calculate subscription ROI')
  }
}
