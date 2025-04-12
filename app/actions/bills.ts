"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function getBills() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createServerSupabaseClient()

    const { data: bills, error } = await supabase
      .from("user_bills")
      .select(`
        *,
        billers (name, category),
        payment_schedule (status, scheduled_date)
      `)
      .eq("user_id", user.id)
      .order("next_payment_date", { ascending: true })

    if (error) {
      console.error("Error fetching bills:", error)
      throw new Error("Failed to fetch bills")
    }

    return bills
  } catch (error) {
    console.error("Error in getBills:", error)
    throw new Error("Failed to fetch bills")
  }
}

export async function getBillById(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createServerSupabaseClient()

    const { data: bill, error } = await supabase
      .from("user_bills")
      .select(`
        *,
        billers (name, category),
        payment_schedule (status, scheduled_date)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching bill:", error)
      throw new Error("Failed to fetch bill")
    }

    // Get bill history
    const { data: history, error: historyError } = await supabase
      .from("bill_payments")
      .select("*")
      .eq("user_bill_id", id)
      .order("created_at", { ascending: false })

    if (historyError) {
      console.error("Error fetching bill history:", historyError)
    }

    return { bill, history: history || [] }
  } catch (error) {
    console.error("Error in getBillById:", error)
    throw new Error("Failed to fetch bill")
  }
}

export async function createBill(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createServerSupabaseClient()

    const name = formData.get("name") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const due_date = formData.get("due_date") as string
    const category_id = (formData.get("category_id") as string) || null
    const payment_method_id = (formData.get("payment_method_id") as string) || null
    const is_recurring = formData.get("is_recurring") === "true"
    const recurrence_pattern = (formData.get("recurrence_pattern") as string) || "monthly"
    const auto_pay = formData.get("auto_pay") === "true"
    const notes = (formData.get("notes") as string) || ""

    const { data: bill, error } = await supabase
      .from("user_bills")
      .insert({
        user_id: user.id,
        name,
        amount,
        next_payment_date: due_date,
        biller_id: formData.get("biller_id") as string || null,
        billing_frequency: formData.get("billing_frequency") as string || "monthly",
        auto_pay,
        notes,
        type: (formData.get("type") as string) || "other",
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating bill:", error)
      throw new Error("Failed to create bill")
    }

    // Create initial bill history entry
    await supabase.from("payment_schedule").insert({
      user_bill_id: bill.id,
      scheduled_date: due_date,
      status: "pending",
    })

    revalidatePath("/bills")
    return bill
  } catch (error) {
    console.error("Error in createBill:", error)
    throw new Error("Failed to create bill")
  }
}

export async function updateBill(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createServerSupabaseClient()

    const name = formData.get("name") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const due_date = formData.get("due_date") as string
    const category_id = (formData.get("category_id") as string) || null
    const payment_method_id = (formData.get("payment_method_id") as string) || null
    const is_recurring = formData.get("is_recurring") === "true"
    const recurrence_pattern = (formData.get("recurrence_pattern") as string) || "monthly"
    const auto_pay = formData.get("auto_pay") === "true"
    const notes = (formData.get("notes") as string) || ""

    // Get current bill to check for changes
    const { data: currentBill, error: fetchError } = await supabase
      .from("user_bills")
      .select("amount, next_payment_date")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching current bill:", fetchError)
      throw new Error("Failed to update bill")
    }

    const { data: bill, error } = await supabase
      .from("user_bills")
      .update({
        name,
        amount,
        next_payment_date: due_date,
        biller_id: formData.get("biller_id") as string || null,
        billing_frequency: formData.get("billing_frequency") as string || "monthly",
        type: (formData.get("type") as string) || "other",
        auto_pay,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating bill:", error)
      throw new Error("Failed to update bill")
    }

    // Create bill history entry if amount or due date changed
    if (currentBill.amount !== amount || currentBill.next_payment_date !== due_date) {
      await supabase.from("bill_price_history").insert({
        user_bill_id: id,
        effective_date: new Date().toISOString(),
        previous_amount: currentBill.amount,
        new_amount: amount,
        reason: "Bill details updated",
        detected_by: "manual",
      })
    }

    revalidatePath("/bills")
    return bill
  } catch (error) {
    console.error("Error in updateBill:", error)
    throw new Error("Failed to update bill")
  }
}

export async function deleteBill(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.from("bills").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting bill:", error)
      throw new Error("Failed to delete bill")
    }

    revalidatePath("/bills")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteBill:", error)
    throw new Error("Failed to delete bill")
  }
}

export async function markBillAsPaid(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createServerSupabaseClient()

    const payment_date = (formData.get("payment_date") as string) || new Date().toISOString().split("T")[0]
    const payment_amount = Number.parseFloat(formData.get("payment_amount") as string)
    const payment_method_id = (formData.get("payment_method_id") as string) || null
    const notes = (formData.get("notes") as string) || ""

    // Update bill status
    const { data: bill, error } = await supabase
      .from("bills")
      .update({
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating bill status:", error)
      throw new Error("Failed to mark bill as paid")
    }

    // Create bill history entry
    await supabase.from("bill_history").insert({
      bill_id: id,
      amount: bill.amount,
      due_date: bill.due_date,
      status: "paid",
      payment_date,
      payment_amount,
      payment_method_id,
      notes,
    })

    // If recurring, create next bill
    if (bill.is_recurring) {
      const nextDueDate = calculateNextDueDate(bill.due_date, bill.recurrence_pattern)

      const { data: nextBill, error: nextBillError } = await supabase
        .from("bills")
        .insert({
          user_id: user.id,
          name: bill.name,
          amount: bill.amount,
          due_date: nextDueDate,
          category_id: bill.category_id,
          payment_method_id: bill.payment_method_id,
          is_recurring: bill.is_recurring,
          recurrence_pattern: bill.recurrence_pattern,
          auto_pay: bill.auto_pay,
          notes: bill.notes,
        })
        .select()
        .single()

      if (nextBillError) {
        console.error("Error creating next recurring bill:", nextBillError)
      } else {
        // Create initial bill history entry for next bill
        await supabase.from("bill_history").insert({
          bill_id: nextBill.id,
          amount: nextBill.amount,
          due_date: nextBill.due_date,
          status: "pending",
        })
      }
    }

    revalidatePath("/bills")
    return { success: true }
  } catch (error) {
    console.error("Error in markBillAsPaid:", error)
    throw new Error("Failed to mark bill as paid")
  }
}

export async function getBillNegotiationOpportunities() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createServerSupabaseClient()

    // Find bills that have been consistently the same amount for several months
    // and are above a certain threshold (potential for negotiation)
    const { data: bills, error } = await supabase
      .from("user_bills")
      .select(`
        id,
        name,
        amount,
        biller_id,
        billers (name, category)
      `)
      .eq("user_id", user.id)
      .eq("is_recurring", true)
      .gt("amount", 50) // Only consider bills above $50
      .order("amount", { ascending: false })

    if (error) {
      console.error("Error fetching bill negotiation opportunities:", error)
      throw new Error("Failed to fetch bill negotiation opportunities")
    }

    // For each bill, check if there are any payment history
    const opportunities = await Promise.all(
      bills.map(async (bill) => {
        const { data: payments } = await supabase
          .from("bill_payments")
          .select("*")
          .eq("user_bill_id", bill.id)
          .order("created_at", { ascending: false })
          .limit(1)

        const hasRecentPayment = payments && payments.length > 0

        return {
          ...bill,
          hasRecentPayment,
          lastPayment: payments && payments.length > 0 ? payments[0] : null,
          potentialSavings: Math.round(bill.amount * 0.15 * 100) / 100, // Estimate 15% potential savings
          negotiationStrategy: generateNegotiationStrategy(bill),
        }
      })
    )

    return opportunities.filter((bill) => !bill.hasRecentPayment)
  } catch (error) {
    console.error("Error in getBillNegotiationOpportunities:", error)
    throw new Error("Failed to fetch bill negotiation opportunities")
  }
}

// Helper function to calculate next due date based on recurrence pattern
function calculateNextDueDate(currentDueDate: string, recurrencePattern: string): string {
  const date = new Date(currentDueDate)

  switch (recurrencePattern) {
    case "weekly":
      date.setDate(date.getDate() + 7)
      break
    case "biweekly":
      date.setDate(date.getDate() + 14)
      break
    case "monthly":
      date.setMonth(date.getMonth() + 1)
      break
    case "quarterly":
      date.setMonth(date.getMonth() + 3)
      break
    case "semiannually":
      date.setMonth(date.getMonth() + 6)
      break
    case "annually":
      date.setFullYear(date.getFullYear() + 1)
      break
    default:
      date.setMonth(date.getMonth() + 1) // Default to monthly
  }

  return date.toISOString().split("T")[0]
}

// Helper function to generate negotiation strategy based on bill type
function generateNegotiationStrategy(bill: any): string {
  const strategies = [
    "Call customer service and mention competitor offers",
    "Ask about loyalty discounts for long-term customers",
    "Request a review of your account for available promotions",
    "Inquire about bundling services for a discount",
    "Mention financial hardship and request temporary rate reduction",
  ]

  // Use category to determine best strategy if available
  if (bill.billers?.category) {
    const category = bill.billers.category.toLowerCase()

    if (category.includes("internet") || category.includes("phone") || category.includes("cable")) {
      return "Research competitor rates and call to request a price match. Mention you're considering switching providers."
    }

    if (category.includes("insurance")) {
      return "Ask about bundling policies, safe driver discounts, or loyalty programs. Consider increasing deductibles to lower monthly premiums."
    }

    if (category.includes("subscription") || category.includes("streaming")) {
      return "Check for annual payment options which often come with discounts. Consider family or group plans if applicable."
    }
  }

  // Return a random strategy if no specific category match
  return strategies[Math.floor(Math.random() * strategies.length)]
}

export async function getUpcomingBills() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createServerSupabaseClient()

    // Get bills due in the next 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { data: bills, error } = await supabase
      .from("user_bills")
      .select(`
        *,
        billers (name, category),
        payment_schedule (status, scheduled_date)
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gte("next_payment_date", new Date().toISOString().split('T')[0])
      .lte("next_payment_date", thirtyDaysFromNow.toISOString().split('T')[0])
      .order("next_payment_date", { ascending: true })

    if (error) {
      console.error("Error fetching upcoming bills:", error)
      throw new Error("Failed to fetch upcoming bills")
    }

    return bills
  } catch (error) {
    console.error("Error in getUpcomingBills:", error)
    throw new Error("Failed to fetch upcoming bills")
  }
}

export async function getBillsByDueDate(startDate: string, endDate: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = await createServerSupabaseClient()

    const { data: bills, error } = await supabase
      .from("user_bills")
      .select(`
        *,
        billers (name, category),
        payment_schedule (status, scheduled_date)
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gte("next_payment_date", startDate)
      .lte("next_payment_date", endDate)
      .order("next_payment_date", { ascending: true })

    if (error) {
      console.error("Error fetching bills by due date:", error)
      throw new Error("Failed to fetch bills by due date")
    }

    return bills
  } catch (error) {
    console.error("Error in getBillsByDueDate:", error)
    throw new Error("Failed to fetch bills by due date")
  }
}

