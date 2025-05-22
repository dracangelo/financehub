"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

// Helper function to safely get authenticated Supabase client
async function getAuthenticatedClient() {
  // Get the current user using the robust authentication method from memory
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, supabase: null }
  }
  
  // Create the Supabase client
  const supabase = await createClient()
  if (!supabase) {
    console.error("Failed to create Supabase client")
    return { user, supabase: null }
  }
  
  return { user, supabase }
}

export async function getSubscriptions() {
  try {
    // Use our helper function to get authenticated client
    const { user, supabase } = await getAuthenticatedClient()
    
    if (!user) {
      redirect("/login")
    }
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return []
    }

    // Use the correct 'bills' table that exists in the database schema
    // Check if supabase client is available
    if (!supabase) {
      console.error("Supabase client is null")
      return [] // Return empty array if no client
    }
    
    // Use the correct subscriptions table
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select('*')
      .eq("user_id", user.id)
      // Include all subscription statuses (active, paused, cancelled)
      .order("next_renewal_date", { ascending: true }) // Using next_renewal_date from the subscriptions table

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return [] // Return empty array instead of throwing error for more resilience
    }

    // Debug: Log the raw subscription data from the database
    console.log("Raw subscriptions data:", JSON.stringify(subscriptions, null, 2))

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found in the database")
      return []
    }

    // If we need biller information, fetch it separately for subscriptions that have biller_id
    const billerIds = subscriptions
      .filter(sub => sub.biller_id)
      .map(sub => sub.biller_id)

    // Define a proper type for the billers object
    interface Biller {
      id: string;
      name: string;
      category?: string;
      website_url?: string;
      support_contact?: string;
    }
    
    // Initialize with proper typing
    const billers: Record<string, Biller> = {}
    
    // Create a variable to store all categories
    const allCategories: Record<string, any> = {}
    
    // Fetch all categories to ensure we have the full list
    if (supabase) {
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("subscription_categories")
          .select('id, name, description, icon');
          
        if (!categoriesError && categoriesData) {
          categoriesData.forEach((category: any) => {
            if (category.id) {
              allCategories[category.id] = {
                id: category.id,
                name: category.name,
                description: category.description || "",
                icon: category.icon || ""
              };
              
              // Also populate the billers object for backward compatibility
              billers[category.id] = {
                id: category.id,
                name: category.name,
                category: category.description || "",
                website_url: "",
                support_contact: ""
              };
            }
          });
        }
      } catch (error) {
        console.error("Error fetching all categories:", error);
      }
    }
    
    // Map database fields to match what the UI component expects
    const subscriptionsWithBillers = subscriptions.map(subscription => {
      const categoryId = subscription.category_id as string | undefined;
      
      // Get category information if available
      const category = categoryId && allCategories[categoryId] ? allCategories[categoryId] : null;
      
      // Map usage_rating back to usage_frequency
      const usageFrequency = mapRatingToUsage(subscription.usage_rating as number | null);
      
      // Map fields from subscriptions table to the expected format in the UI
      return {
        id: subscription.id,
        name: subscription.name,
        provider: subscription.vendor || "",
        amount: subscription.amount,
        billing_cycle: subscription.frequency,
        next_payment_date: subscription.next_renewal_date,
        status: subscription.status,
        auto_pay: subscription.auto_renew === true, // Ensure boolean value
        payment_method: subscription.support_contact || "",
        usage_frequency: usageFrequency,
        usage_level: usageFrequency,
        category_id: categoryId,
        category: category ? category.name : "uncategorized",
        // Include any other fields from the original subscription
        ...subscription,
        // Add category information in the biller field for backward compatibility
        biller: category ? {
          id: category.id,
          name: category.name,
          category: category.description,
          website_url: "",
          support_contact: subscription.support_contact || ""
        } : null
      }
    })

    // Debug: Log the final processed subscription data being returned to the UI
    console.log("Final subscriptions data being returned:", JSON.stringify(subscriptionsWithBillers, null, 2))
    console.log("Number of subscriptions found:", subscriptionsWithBillers.length)

    return subscriptionsWithBillers
  } catch (error) {
    console.error("Error in getSubscriptions:", error)
    // Return empty array instead of throwing error for more resilience
    return []
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
    // Use our helper function to get authenticated client
    const { user, supabase } = await getAuthenticatedClient()
    
    if (!user) {
      redirect("/login")
    }
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Authentication failed" }
    }

    // Extract form data
    const name = formData.get("name") as string | null
    const provider = formData.get("provider") as string | null
    const amountValue = formData.get("amount")
    const amount = amountValue ? Number(amountValue) : 0
    
    // Get values with defaults for required fields
    let billing_cycle = formData.get("billing_cycle") as string | null || formData.get("billing_frequency") as string | null
    if (!billing_cycle) {
      billing_cycle = "monthly"
    }
    
    // Map billing cycle to valid billing_frequency values according to the schema constraint
    // check (billing_frequency in ('monthly', 'quarterly', 'yearly', 'weekly'))
    let billing_frequency: string;
    switch (billing_cycle) {
      case 'weekly':
        billing_frequency = 'weekly';
        break;
      case 'biweekly':
      case 'bi-weekly':
        billing_frequency = 'weekly'; // closest match
        break;
      case 'monthly':
        billing_frequency = 'monthly';
        break;
      case 'quarterly':
        billing_frequency = 'quarterly';
        break;
      case 'semi-annually':
      case 'semiannually':
      case 'semi_annually':
        billing_frequency = 'quarterly'; // closest match
        // Standardize the billing_cycle to match the database enum
        billing_cycle = 'semi-annually';
        break;
      case 'annually':
      case 'yearly':
        billing_frequency = 'yearly';
        break;
      default:
        billing_frequency = 'monthly';
    }
    
    // Set start date to today if not provided
    let start_date = formData.get("start_date") as string | null
    if (!start_date) {
      start_date = new Date().toISOString().split('T')[0]
    }
    
    // Get the next billing date from the form - use the correct field name
    let next_payment_date = formData.get("next_billing_date") as string | null
    if (!next_payment_date) {
      const today = new Date()
      today.setMonth(today.getMonth() + 1) // Add 1 month
      next_payment_date = today.toISOString().split('T')[0]
    }
    
    // Get payment method and auto-renew values
    const payment_method = formData.get("payment_method_id") as string | null
    
    // Make sure we correctly handle auto_renew - check for both possible field names
    const auto_renew_value = formData.get("auto_renew") || formData.get("auto_pay")
    const auto_pay = auto_renew_value === "true" || auto_renew_value === "on"
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

    // Handle category - the form sends category names, not UUIDs
    let category_id: string | null = null;
    const categoryValue = formData.get("category_id") as string;
    
    // If the category value is not a UUID, treat it as a category name
    if (categoryValue && categoryValue !== "uncategorized" && supabase) {
      try {
        // Try to find the category by name
        const { data: existingCategory, error: categoryError } = await supabase
          .from("subscription_categories")
          .select("id")
          .eq("name", categoryValue)
          .single();
        
        if (categoryError || !existingCategory) {
          // Create a new category with this name
          const { data: newCategory, error: newCategoryError } = await supabase
            .from("subscription_categories")
            .insert({
              name: categoryValue,
              description: `${categoryValue} category`
            })
            .select("id")
            .single();
            
          if (newCategoryError) {
            console.error("Error creating subscription category:", newCategoryError);
            // Continue without category
          } else if (newCategory) {
            category_id = newCategory.id;
          }
        } else {
          category_id = existingCategory.id;
        }
      } catch (error) {
        console.error("Error handling category:", error);
        // Continue without category
      }
    }

    // Check if supabase client is available
    if (!supabase) {
      console.error("Supabase client is null")
      return { success: false, error: "Authentication failed" }
    }
    
    // Create subscription in the subscriptions table using the correct schema fields
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        vendor: provider,
        name,
        // Use the standardized billing_cycle value that we've normalized above
        // This ensures it matches one of the valid enum values in the database
        frequency: billing_cycle,
        amount: amount,
        next_renewal_date: next_payment_date,
        // Make sure we're using the correct category_id
        category_id: category_id,
        auto_renew: auto_pay,
        status: "active",
        // Store the payment method correctly
        support_contact: formData.get("payment_method_id") as string || payment_method || "",
        currency: formData.get("currency") as string || "USD",
        description: formData.get("description") as string || null,
        // Map usage_frequency to usage_rating (high=10, medium=5, low=1)
        usage_rating: mapUsageToRating(formData.get("usage_frequency") as string || "medium"),
        cancel_url: formData.get("cancellation_url") as string || "",
        notes: formData.get("notes") as string || ""
      })
      .select("id")
      .single()

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError)
      // Return error instead of throwing to make the application more resilient
      return { success: false, error: subscriptionError }
    }

    revalidatePath("/subscriptions")
    return { success: true, data: subscription }
  } catch (error) {
    console.error("Error in createSubscription:", error)
    // Return error instead of throwing to make the application more resilient
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Helper function to map usage frequency to a numeric rating
function mapUsageToRating(usageFrequency: string): number {
  switch (usageFrequency.toLowerCase()) {
    case 'high':
      return 10;
    case 'medium':
      return 5;
    case 'low':
      return 1;
    default:
      return 5; // Default to medium usage
  }
}

// Helper function to map numeric rating back to usage frequency
function mapRatingToUsage(rating: number | null): string {
  if (!rating) return 'medium';
  
  if (rating >= 8) return 'high';
  if (rating >= 3) return 'medium';
  return 'low';
}

export async function updateSubscription(id: string, formData: FormData) {
  try {
    // Use our helper function to get authenticated client
    const { user, supabase } = await getAuthenticatedClient()
    
    if (!user) {
      redirect("/login")
    }
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Authentication failed" }
    }

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
        .select("amount, frequency")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (!fetchError && currentSub) {
        // Handle category - the form sends category names, not UUIDs
        let finalCategoryId: string | null = null;
        const categoryValue = formData.get("category_id") as string;
        
        // If the category value is not a UUID, treat it as a category name
        if (categoryValue && categoryValue !== "uncategorized") {
          try {
            // Try to find the category by name
            const { data: existingCategory, error: categoryError } = await supabase
              .from("subscription_categories")
              .select("id")
              .eq("name", categoryValue)
              .single();
            
            if (categoryError || !existingCategory) {
              // Create a new category with this name
              const { data: newCategory, error: newCategoryError } = await supabase
                .from("subscription_categories")
                .insert({
                  name: categoryValue,
                  description: `${categoryValue} category`
                })
                .select("id")
                .single();
                
              if (newCategoryError) {
                console.error("Error creating subscription category:", newCategoryError);
                // Continue without category
              } else if (newCategory) {
                finalCategoryId = newCategory.id;
              }
            } else {
              finalCategoryId = existingCategory.id;
            }
          } catch (error) {
            console.error("Error handling category in update:", error);
            // Continue without category
          }
        }
        
        // Map usage_frequency to usage_rating
        const usageRating = mapUsageToRating(usage_frequency);
        
        const { data: subscription, error } = await supabase
          .from("subscriptions")
          .update({
            name,
            vendor: provider,
            amount,
            frequency: billing_cycle, // Map billing_cycle to frequency
            next_renewal_date: next_billing_date, // Map next_billing_date to next_renewal_date
            category_id: finalCategoryId,
            support_contact: payment_method_id, // Map payment_method_id to support_contact
            auto_renew,
            status,
            cancel_url: cancellation_url, // Map cancellation_url to cancel_url
            usage_rating: usageRating, // Map usage_frequency to usage_rating
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

        // Create subscription history entry if amount or frequency changed
        if (currentSub.amount !== amount || (currentSub as any).frequency !== billing_cycle) {
          try {
            await supabase.from("subscription_price_changes").insert({
              subscription_id: id,
              old_amount: currentSub.amount,
              new_amount: amount,
              changed_at: new Date().toISOString(),
              reason: "Subscription details updated"
            })
          } catch (historyError) {
            console.error("Error recording subscription history:", historyError)
            // Continue even if history recording fails
          }
        }

        revalidatePath("/subscriptions")
        return subscription
      }
    } catch (err) {
      console.log("Not found in subscriptions table, trying bills")
    }

    // If we get here, try updating in the bills table using the correct schema
    try {
      // First, get the current bill to see what fields exist
      const { data: currentBill, error: fetchBillError } = await supabase
        .from("bills")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()
      
      if (fetchBillError) {
        console.error("Error fetching bill:", fetchBillError)
        return { success: false, error: "Failed to find subscription" }
      }
      
      // Build update object based on existing columns from the bills schema
      const updateData: Record<string, any> = {
        name,
        amount_due: amount // Use amount_due field from bills schema
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
      
      // ... (rest of the code remains the same)

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
      
      // Map fields to the correct schema from bills.sql
      if ('frequency' in currentBill) updateData.frequency = mappedBillingFrequency
      if ('next_due_date' in currentBill) updateData.next_due_date = next_billing_date
      if ('status' in currentBill) updateData.status = status
      if ('is_automatic' in currentBill) updateData.is_automatic = auto_renew
      if ('expected_payment_account' in currentBill) updateData.expected_payment_account = payment_method_id
      if ('vendor' in currentBill) updateData.vendor = provider
      if ('description' in currentBill) updateData.description = notes
      if ('category_id' in currentBill) updateData.category_id = category_id
      if ('currency' in currentBill) updateData.currency = formData.get("currency") as string || "USD"
      
      // Check if supabase client is available
      if (!supabase) {
        console.error("Supabase client is null")
        return { success: false, error: "Authentication failed" }
      }
      
      const { data: bill, error: billError } = await supabase
        .from("bills")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (billError) {
        console.error("Error updating bill:", billError)
        return { success: false, error: "Failed to update subscription" }
      }

      revalidatePath("/subscriptions")
      return { success: true, data: bill }
    } catch (err) {
      console.error("Error updating in bills table:", err)
      return { success: false, error: "Failed to update subscription" }
    }
  } catch (error) {
    console.error("Error in updateSubscription:", error)
    return { success: false, error: "Failed to update subscription" }
  }
}

export async function deleteSubscription(id: string) {
  try {
    // Use our helper function to get authenticated client
    const { user, supabase } = await getAuthenticatedClient()
    
    if (!user) {
      redirect("/login")
    }
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Authentication failed" }
    }
    
    let success = false;

    // First try to delete from subscriptions table (legacy table)
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
      // Continue to try bills table
    }

    // Then try to delete from bills table (correct table)
    try {
      const { error } = await supabase
        .from("bills")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
      
      if (!error) {
        success = true;
        console.log("Successfully deleted from bills table");
      }
    } catch (billError) {
      console.log("Item not found in bills table or other error:", billError);
      // If we haven't succeeded in either table, we'll return an error below
    }

    if (!success) {
      return { success: false, error: "Failed to delete subscription from any table" };
    }

    revalidatePath("/subscriptions")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteSubscription:", error)
    return { success: false, error: "Failed to delete subscription" }
  }
}

export async function recordSubscriptionUsage(id: string, formData: FormData) {
  try {
    // Use our helper function to get authenticated client
    const { user, supabase } = await getAuthenticatedClient()
    
    if (!user) {
      redirect("/login")
    }
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Authentication failed" }
    }

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
      return { success: false, error: "Failed to record subscription usage" }
    }

    // Update subscription usage_frequency based on recent usage patterns
    // Ensure supabase client is still available
    if (!supabase) {
      console.error("Supabase client is null")
      return { success: true, data, warning: "Could not update usage frequency" }
    }
    
    const { data: usageData } = await supabase
      .from("subscription_usage")
      .select("*")
      .eq("subscription_id", id)
      .order("usage_date", { ascending: false })
      .limit(10)

    if (usageData && usageData.length > 0 && supabase) {
      const avgUsageValue = usageData.reduce((sum: number, item: any) => sum + (item.usage_value || 0), 0) / usageData.length
      let usage_frequency = "medium"

      if (avgUsageValue > 7) {
        usage_frequency = "high"
      } else if (avgUsageValue < 4) {
        usage_frequency = "low"
      }

      try {
        await supabase.from("subscriptions").update({ usage_frequency }).eq("id", id).eq("user_id", user.id)
      } catch (updateError) {
        console.error("Error updating usage frequency:", updateError)
        // Continue without throwing - this is a non-critical update
      }
    }

    revalidatePath(`/subscriptions/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Error in recordSubscriptionUsage:", error)
    return { success: false, error: "Failed to record subscription usage" }
  }
}

export async function getSubscriptionROI() {
  try {
    // Use our helper function to get authenticated client
    const { user, supabase } = await getAuthenticatedClient()
    
    if (!user) {
      redirect("/login")
    }
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return []
    }

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

    let allSubscriptions: SubscriptionData[] = []

    // Get data from the subscriptions table
    try {
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          name,
          vendor,
          amount,
          frequency,
          category_id,
          auto_renew,
          support_contact,
          usage_rating
        `)
        .eq("user_id", user.id)
        .eq("status", "active")

      if (error) {
        console.error("Error fetching subscriptions for ROI:", error)
        return [] // Return empty array instead of throwing error for more resilience
      }

      if (!subscriptions || subscriptions.length === 0) {
        return [] // Return empty array instead of throwing error for more resilience
      }

      // Fetch categories to map category_id to names
      const categoryMap: Record<string, string> = {}
      try {
        const { data: categories } = await supabase
          .from("subscription_categories")
          .select('id, name')

        if (categories) {
          categories.forEach(cat => {
            if (cat.id) categoryMap[cat.id] = cat.name
          })
        }
      } catch (catError) {
        console.error("Error fetching categories:", catError)
        // Continue without categories
      }

      // Format the data to match our interface
      allSubscriptions = subscriptions.map(sub => {
        // Map usage_rating to usage_frequency
        const usageFrequency = mapRatingToUsage(sub.usage_rating as number | null)
        
        return {
          id: sub.id,
          name: sub.name,
          provider: sub.vendor || 'Unknown',
          category: sub.category_id && categoryMap[sub.category_id] ? categoryMap[sub.category_id] : 'Uncategorized',
          amount: sub.amount,
          billing_cycle: sub.frequency || 'monthly',
          usage_frequency: usageFrequency,
          auto_renew: sub.auto_renew || false,
          payment_method: sub.support_contact || 'Unknown'
        } as SubscriptionData
      })
    } catch (error) {
      console.error("Error fetching subscription data:", error)
      return [] // Return empty array instead of throwing error for more resilience
    }
    
    // If we have no data at all, return empty array
    if (allSubscriptions.length === 0) {
      return []
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
        const { data: usageData, error: usageError } = await supabase
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

export async function optimizePaymentSchedule() {
  try {
    // Use our helper function to get authenticated client
    const { user, supabase } = await getAuthenticatedClient()
    
    if (!user) {
      redirect('/login')
    }
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Authentication failed" }
    }
    
    // Get all subscriptions - focus only on subscriptions for now
    // since we've had issues with the bills table
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
    
    if (subsError) {
      console.error('Error fetching subscriptions:', subsError)
      // Return empty array instead of throwing error
      return []
    }
    
    // Process subscriptions to create payment timeline data
    const processedSubscriptions = subscriptions?.map(sub => {
      // Extract the day of month from next_renewal_date or next_billing_date or use a default
      let dayOfMonth = 1
      
      if (sub.next_renewal_date) {
        dayOfMonth = new Date(sub.next_renewal_date).getDate()
      } else if (sub.next_billing_date) {
        dayOfMonth = new Date(sub.next_billing_date).getDate()
      }
      
      return {
        id: sub.id,
        name: sub.name,
        amount: sub.amount,
        date: dayOfMonth,
        recurrence: sub.recurrence || sub.billing_cycle,
        category: sub.category,
        is_active: sub.is_active !== false // Default to true if not specified
      }
    }) || []
    
    // Only include active subscriptions
    const activeSubscriptions = processedSubscriptions.filter(sub => sub.is_active)
    
    return activeSubscriptions
  } catch (error) {
    console.error("Error in optimizePaymentSchedule:", error)
    // Return empty array instead of throwing error
    return []
  }
}

export async function calculateSubscriptionROI(subscriptionId: string) {
  try {
    // Use our helper function to get authenticated client
    const { user, supabase } = await getAuthenticatedClient()
    
    if (!user) {
      redirect('/login')
    }
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Authentication failed" }
    }
    
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


export async function findDuplicateServices() {
  try {
    // Use our helper function to get authenticated client
    const { user, supabase } = await getAuthenticatedClient()
    
    if (!user) {
      redirect("/login")
    }
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return []
    }
    
    // Define interface for subscription data
    interface SubscriptionData {
      id: string;
      name: string;
      vendor: string;
      amount: number;
      frequency: string;
      category: string;
    }
    
    let allSubscriptions: SubscriptionData[] = [];

    // Get data from the subscriptions table
    try {
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          name,
          vendor,
          amount,
          frequency,
          category_id
        `)
        .eq("user_id", user.id)
        .eq("status", "active")

      if (error) {
        console.error("Error fetching subscriptions for duplicate check:", error)
        return [] // Return empty array instead of throwing error for more resilience
      }

      if (!subscriptions || subscriptions.length === 0) {
        return [] // Return empty array instead of throwing error for more resilience
      }

      // Fetch categories to map category_id to names
      const categoryMap: Record<string, string> = {}
      try {
        const { data: categories } = await supabase
          .from("subscription_categories")
          .select('id, name')

        if (categories) {
          categories.forEach(cat => {
            if (cat.id) categoryMap[cat.id] = cat.name
          })
        }
      } catch (catError) {
        console.error("Error fetching categories:", catError)
        // Continue without categories
      }

      // Format the subscriptions with category information
      allSubscriptions = subscriptions.map(sub => ({
        id: sub.id,
        name: sub.name,
        vendor: sub.vendor || 'Unknown',
        amount: sub.amount,
        frequency: sub.frequency || 'monthly',
        category: sub.category_id && categoryMap[sub.category_id] ? categoryMap[sub.category_id] : 'Uncategorized'
      }));
    } catch (error) {
      console.error("Error fetching subscription data:", error)
      return [] // Return empty array instead of throwing error for more resilience
    }

    // Group subscriptions by category
    const subscriptionsByCategory = allSubscriptions.reduce<Record<string, SubscriptionData[]>>((acc, sub) => {
      // Use the category field directly from our mapped data
      const categoryName = sub.category || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(sub);
      return acc;
    }, {});

    // Find potential duplicates within each category
    const potentialDuplicates = [];

    for (const category in subscriptionsByCategory) {
      const subs = subscriptionsByCategory[category];

      // Only check categories with multiple subscriptions
      if (subs.length > 1) {
        // Check for streaming services
        if (category.toLowerCase().includes("streaming") || category.toLowerCase().includes("entertainment")) {
          potentialDuplicates.push({
            category,
            subscriptions: subs,
            reason: "Multiple streaming services detected",
            recommendation: "Consider consolidating to fewer streaming platforms or rotating subscriptions monthly"
          });
        }

        // Check for similar service providers
        const providers = subs.map(s => (s.vendor || '').toLowerCase());
        const uniqueProviders = new Set(providers);

        if (providers.length > uniqueProviders.size) {
          // Find the duplicated providers
          const duplicatedProviders = providers.filter((item, index) => providers.indexOf(item) !== index);

          for (const provider of duplicatedProviders) {
            const duplicateSubs = subs.filter(s => (s.vendor || '').toLowerCase() === provider);
            potentialDuplicates.push({
              category,
              subscriptions: duplicateSubs,
              reason: `Multiple subscriptions from ${provider}`,
              recommendation: "Check if these services can be bundled or if one can be eliminated"
            });
          }
        }

        // Check for potentially overlapping services
        if (subs.length >= 3) {
          potentialDuplicates.push({
            category,
            subscriptions: subs,
            reason: `Multiple services in ${category} category`,
            recommendation: "Review if all these services are necessary or if some have overlapping features"
          });
        }
      }
    }

    return potentialDuplicates;
  } catch (error) {
    console.error("Error in findDuplicateServices:", error);
    throw new Error("Failed to find duplicate services");
  }
}
