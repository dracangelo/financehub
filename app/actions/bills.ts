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

    // Extract and validate form data with proper type conversion
    const name = formData.get("name") as string
    if (!name) {
      throw new Error("Bill name is required")
    }

    const amountStr = formData.get("amount") as string
    if (!amountStr) {
      throw new Error("Bill amount is required")
    }
    const amount = Number.parseFloat(amountStr)
    if (isNaN(amount)) {
      throw new Error("Invalid bill amount")
    }

    const due_date = formData.get("due_date") as string
    if (!due_date) {
      throw new Error("Due date is required")
    }
    
    // Validate date format
    let formattedDate;
    try {
      const dateObj = new Date(due_date);
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date");
      }
      formattedDate = dateObj.toISOString().split('T')[0];
    } catch (e) {
      console.error("Date parsing error:", e);
      // Fallback to today's date if there's an error
      formattedDate = new Date().toISOString().split('T')[0];
    }

    // Optional fields with proper defaults
    const type = (formData.get("type") as string) || "other"
    const billing_frequency = (formData.get("recurrence_pattern") as string) || "monthly"
    const auto_pay = formData.get("auto_pay") === "true"
    const is_recurring = formData.get("is_recurring") === "true"

    // Create the bill with only essential fields that exist in the database
    const { data: bill, error } = await supabase
      .from("user_bills")
      .insert({
        user_id: user.id,
        name,
        amount,
        next_payment_date: formattedDate,
        billing_frequency,
        auto_pay,
        type,
        is_active: true,
        is_recurring
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating bill:", error)
      throw new Error("Failed to create bill")
    }

    // Create initial payment schedule entry
    const { error: scheduleError } = await supabase.from("payment_schedule").insert({
      user_bill_id: bill.id,
      scheduled_date: formattedDate,
      status: "pending"
    })

    if (scheduleError) {
      console.error("Error creating payment schedule:", scheduleError)
      // Don't throw here, we've already created the bill
    }

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

    // Extract and validate form data
    const name = formData.get("name") as string
    if (!name) {
      throw new Error("Bill name is required")
    }

    const amountStr = formData.get("amount") as string
    if (!amountStr) {
      throw new Error("Bill amount is required")
    }
    const amount = Number.parseFloat(amountStr)
    if (isNaN(amount)) {
      throw new Error("Invalid bill amount")
    }

    const due_date = formData.get("due_date") as string
    if (!due_date) {
      throw new Error("Due date is required")
    }
    
    // Validate date format
    let formattedDate;
    try {
      const dateObj = new Date(due_date);
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date");
      }
      formattedDate = dateObj.toISOString().split('T')[0];
    } catch (e) {
      console.error("Date parsing error:", e);
      // Fallback to today's date if there's an error
      formattedDate = new Date().toISOString().split('T')[0];
    }

    // Get optional fields
    const type = (formData.get("type") as string) || "other"
    const billing_frequency = (formData.get("recurrence_pattern") as string) || "monthly"
    const auto_pay = formData.get("auto_pay") === "true"
    const is_recurring = formData.get("is_recurring") === "true"
    const payment_status = formData.get("status") as string || "pending"

    // First, check if the bill exists and belongs to the user
    const { data: existingBill, error: fetchError } = await supabase
      .from("user_bills")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching bill:", fetchError)
      throw new Error("Bill not found or you don't have permission to update it")
    }

    // Update the bill with fields that exist in the database
    const { data: bill, error } = await supabase
      .from("user_bills")
      .update({
        name,
        amount,
        next_payment_date: formattedDate,
        billing_frequency,
        auto_pay,
        type,
        is_recurring
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating bill:", error)
      throw new Error("Failed to update bill")
    }

    // Update the payment schedule if it exists
    const { data: scheduleData, error: scheduleQueryError } = await supabase
      .from("payment_schedule")
      .select("id")
      .eq("user_bill_id", id)
      .order("scheduled_date", { ascending: false })
      .limit(1)

    if (!scheduleQueryError && scheduleData && scheduleData.length > 0) {
      const scheduleId = scheduleData[0].id
      
      await supabase
        .from("payment_schedule")
        .update({
          scheduled_date: formattedDate,
          status: payment_status
        })
        .eq("id", scheduleId)
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

    // Get the bill details
    const { data: bill, error: billError } = await supabase
      .from("user_bills")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (billError) {
      console.error("Error fetching bill:", billError)
      throw new Error("Failed to mark bill as paid")
    }

    // Update payment schedule to mark as paid
    const { data: scheduleData, error: scheduleQueryError } = await supabase
      .from("payment_schedule")
      .select("id")
      .eq("user_bill_id", id)
      .order("scheduled_date", { ascending: false })
      .limit(1)

    if (scheduleQueryError) {
      console.error("Error fetching payment schedule:", scheduleQueryError)
    } else if (scheduleData && scheduleData.length > 0) {
      const scheduleId = scheduleData[0].id
      
      const { error: updateError } = await supabase
        .from("payment_schedule")
        .update({
          status: "paid",
          actual_payment_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", scheduleId)

      if (updateError) {
        console.error("Error updating payment schedule:", updateError)
      }
    }

    // Create bill payment record
    const { error: paymentError } = await supabase.from("bill_payments").insert({
      user_bill_id: id,
      payment_schedule_id: scheduleData && scheduleData.length > 0 ? scheduleData[0].id : null,
      amount_paid: bill.amount,
      payment_date: new Date().toISOString(),
      payment_method: "other",
      payment_status: "completed",
      notes: "Marked as paid manually"
    })

    if (paymentError) {
      console.error("Error creating bill payment:", paymentError)
    }

    // If recurring, calculate next payment date and create new entry
    if (bill.is_recurring) {
      const nextDueDate = calculateNextDueDate(bill.next_payment_date, bill.billing_frequency)
      
      // Update bill with next payment date
      const { error: updateError } = await supabase
        .from("user_bills")
        .update({
          next_payment_date: nextDueDate
        })
        .eq("id", id)
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Error updating bill next payment date:", updateError)
        throw new Error("Failed to update next payment date")
      }

      // Create new payment schedule entry for next payment
      const { error: newScheduleError } = await supabase.from("payment_schedule").insert({
        user_bill_id: id,
        scheduled_date: nextDueDate,
        status: "pending"
      })

      if (newScheduleError) {
        console.error("Error creating new payment schedule:", newScheduleError)
      }
    } else {
      // For non-recurring bills, mark the bill itself as paid by updating the payment_status field
      const { error: updateBillError } = await supabase
        .from("user_bills")
        .update({
          is_paid: true // Add a flag to indicate the bill is paid
        })
        .eq("id", id)
        .eq("user_id", user.id)

      if (updateBillError) {
        console.error("Error updating bill payment status:", updateBillError)
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
