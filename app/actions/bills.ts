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
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }

    // Use the bills table that exists in the database
    const { data: bills, error } = await supabase
      .from("bills")
      .select(`
        *,
        category:category_id(id, name, description, icon),
        bill_payments(id, payment_date, amount_paid, payment_method, note)
      `)
      .eq("user_id", user.id)
      .order("next_due_date", { ascending: true })

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
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }

    const { data: bill, error } = await supabase
      .from("bills")
      .select(`
        *,
        category:category_id(id, name, description, icon)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching bill:", error)
      throw new Error("Failed to fetch bill")
    }

    // Get bill payment history
    const { data: history, error: historyError } = await supabase
      .from("bill_payments")
      .select("*")
      .eq("bill_id", id)
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
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }

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

    const due_date = formData.get("next_payment_date") as string
    if (!due_date) {
      throw new Error("Due date is required")
    }
    
    // Validate and standardize date format
    let formattedDate;
    try {
      // Parse the date string
      const dateObj = new Date(due_date);
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date");
      }
      
      // Ensure consistent date format (YYYY-MM-DD)
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
      
      console.log(`Parsed due date from form: '${due_date}' → standardized as: '${formattedDate}'`);
    } catch (e) {
      console.error("Date parsing error:", e);
      // Fallback to today's date if there's an error
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
      console.log(`Using fallback date due to parsing error: ${formattedDate}`);
    }

    // Optional fields with proper defaults
    // Map the UI frequency values to the database enum values
    let frequency = (formData.get("recurrence_pattern") as string) || "monthly"
    // Ensure frequency matches the database enum values
    if (frequency === "biweekly") frequency = "bi_weekly"
    else if (frequency === "semi-annually" || frequency === "semiannually") frequency = "semi_annual"
    else if (frequency === "annually") frequency = "annual"
    
    const is_automatic = formData.get("auto_pay") === "true"
    // Store whether the bill is recurring in a variable for later use
    // but don't try to save it to the database since the column doesn't exist
    const isRecurring = formData.get("is_recurring") === "true"
    
    // Get the category ID from the form data
    const categoryId = formData.get("category_id") as string || null
    
    // Determine initial bill status based on due date
    // The database only accepts these enum values: 'unpaid', 'paid', 'overdue', 'cancelled'
    // We'll use them directly as requested:
    // - unpaid: default for new bills
    // - paid: when clicked by the user
    // - overdue: if the date is past due
    // - cancelled: if a user cancels the bill
    let initialStatus = "unpaid";
    try {
      // Parse the date properly to ensure accurate comparison
      const dueDate = new Date(formattedDate);
      const today = new Date();
      
      // Set hours to 0 for proper comparison
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      // Calculate days until due
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Set to 'overdue' if the due date has passed, otherwise use 'unpaid'
      if (diffDays < 0) {
        initialStatus = "overdue";
      } else {
        initialStatus = "unpaid";
      }
      
      console.log(`Setting initial status for bill: ${initialStatus}, due date: ${formattedDate}, days until due: ${diffDays}`);
    } catch (e) {
      console.error("Error calculating initial bill status:", e);
      // Default to unpaid if there's an error
      initialStatus = "unpaid";
    }
    
    // Always use the date that the user sets, even if it's in the past
    let finalDueDate = formattedDate;
    
    // Log the date and status for debugging
    console.log(`Using user-specified due date: ${finalDueDate} with status: ${initialStatus}`);
    
    // Note: We're no longer automatically calculating the next occurrence date
    // Instead, we're using exactly what the user specified
    
    // Create a new bill record using the correct table and field names based on the actual database schema
    const { data: bill, error } = await supabase
      .from("bills")
      .insert({
        user_id: user.id,
        name,
        amount_due: amount,
        next_due_date: finalDueDate,
        frequency: frequency,
        is_automatic: is_automatic,
        description: formData.get("description") as string || "",
        category_id: categoryId,
        vendor: formData.get("vendor") as string || null,
        expected_payment_account: formData.get("payment_account") as string || null,
        reminder_days: parseInt(formData.get("reminder_days") as string || "3", 10),
        status: initialStatus,
        currency: formData.get("currency") as string || "USD"
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating bill:", error)
      throw new Error("Failed to create bill")
    }

    // Create initial payment schedule entry
    if (bill && supabase) {
      console.log('Creating payment schedule for bill:', bill.id);
      
      try {
        const { error: scheduleError } = await supabase.from("bill_payments").insert({
          bill_id: bill.id,
          user_id: user.id,
          amount_paid: 0, // Initial entry with zero amount
          payment_date: finalDueDate, // Use the final calculated due date
          payment_method: "none",
          note: "Initial payment schedule"
        })

        if (scheduleError) {
          console.error("Error creating payment schedule:", scheduleError)
          // Don't throw here, we've already created the bill
        }
      } catch (scheduleErr) {
        console.error("Exception creating payment schedule:", scheduleErr)
        // Continue even if payment schedule creation fails
      }
    }

    revalidatePath("/bills")
    return bill
  } catch (error) {
    console.error("Error in createBill:", error)
    // Include the original error message for better debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create bill: ${errorMessage}`)
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

    const due_date = formData.get("next_payment_date") as string
    if (!due_date) {
      throw new Error("Due date is required")
    }
    
    // Validate and standardize date format
    let formattedDate;
    try {
      // Parse the date string
      const dateObj = new Date(due_date);
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date");
      }
      
      // Ensure consistent date format (YYYY-MM-DD)
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
      
      console.log(`Parsed due date from form: '${due_date}' → standardized as: '${formattedDate}'`);
    } catch (e) {
      console.error("Date parsing error:", e);
      // Fallback to today's date if there's an error
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
      console.log(`Using fallback date due to parsing error: ${formattedDate}`);
    }

    // Get optional fields
    const type = (formData.get("type") as string) || "other"
    
    // Map the UI frequency values to the database enum values
    let billing_frequency = (formData.get("recurrence_pattern") as string) || "monthly"
    // Ensure frequency matches the database enum values
    if (billing_frequency === "biweekly") billing_frequency = "bi_weekly"
    else if (billing_frequency === "semi-annually" || billing_frequency === "semiannually") billing_frequency = "semi_annual"
    else if (billing_frequency === "annually") billing_frequency = "annual"
    
    const auto_pay = formData.get("auto_pay") === "true"
    
    // Map the payment status to valid bill_status enum values
    let payment_status = formData.get("status") as string || "unpaid"
    // Ensure status matches the database enum values: 'unpaid', 'paid', 'overdue', 'cancelled'
    if (payment_status === "pending") payment_status = "unpaid"

    // First, check if the bill exists and belongs to the user
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }
    
    const { data: existingBill, error: fetchError } = await supabase
      .from("bills")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching bill:", fetchError)
      throw new Error("Bill not found or you don't have permission to update it")
    }

    // First, fetch the current bill to get the current amount for comparison
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }
    
    const { data: currentBill, error: fetchCurrentError } = await supabase
      .from("bills")
      .select("amount_due")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchCurrentError) {
      console.error("Error fetching current bill amount:", fetchCurrentError)
      // Continue with the update even if we can't fetch the current amount
    }

    // Check if the amount is changing
    const isAmountChanging = currentBill && amount !== currentBill.amount_due
    
    // Update the bill with fields that exist in the database
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }
    
    const { data: bill, error } = await supabase
      .from("bills")
      .update({
        name,
        amount_due: amount,
        next_due_date: formattedDate,
        frequency: billing_frequency,
        is_automatic: auto_pay,
        description: formData.get("description") as string || "",
        category_id: formData.get("category_id") as string || null,
        vendor: formData.get("vendor") as string || null,
        expected_payment_account: formData.get("payment_account") as string || null,
        status: payment_status,
        currency: formData.get("currency") as string || "USD"
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating bill:", error)
      throw new Error("Failed to update bill")
    }
    
    // If the amount changed, manually insert a price change record with admin rights
    if (isAmountChanging && currentBill && supabase) {
      try {
        // Use service role to bypass RLS
        const { error: priceChangeError } = await supabase
          .from("bill_price_changes")
          .insert({
            bill_id: id,
            old_amount: currentBill.amount_due,
            new_amount: amount,
            reason: "User updated bill amount"
          })
        
        if (priceChangeError) {
          console.error("Error recording price change (non-critical):", priceChangeError)
          // Don't throw an error here, as the bill update itself was successful
        }
      } catch (priceChangeErr) {
        console.error("Exception recording price change (non-critical):", priceChangeErr)
      }
    }

    // Update the payment schedule if it exists
    if (supabase) {
      const { data: scheduleData, error: scheduleQueryError } = await supabase
        .from("bill_payments")
        .select("id")
        .eq("bill_id", id)
        .order("payment_date", { ascending: false })
        .limit(1)

      if (!scheduleQueryError && scheduleData && scheduleData.length > 0) {
        const scheduleId = scheduleData[0].id
        
        await supabase
          .from("bill_payments")
          .update({
            payment_date: formattedDate
          })
          .eq("id", scheduleId)
      }
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
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }

    // First check if the bill exists and belongs to the user
    const { data: bill, error: fetchError } = await supabase
      .from("bills")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching bill:", fetchError)
      throw new Error("Bill not found or you don't have permission to delete it")
    }

    // Delete the bill
    const { error } = await supabase
      .from("bills")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

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
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }

    // Get the bill details
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }
    
    const { data: bill, error: billError } = await supabase
      .from("bills")
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
      .from("bill_payments")
      .select("id, note, payment_date")
      .eq("bill_id", id)
      .order("payment_date", { ascending: false })
      .limit(1)

    if (scheduleQueryError) {
      console.error("Error fetching payment schedule:", scheduleQueryError)
    } else if (scheduleData && scheduleData.length > 0) {
      const scheduleId = scheduleData[0].id
      
      // Determine if the bill is overdue based on payment_date
      const paymentDate = new Date(scheduleData[0].payment_date)
      const today = new Date()
      const isOverdue = paymentDate < today
      
      // Log if we're handling an overdue bill
      if (isOverdue) {
        console.log("Updating overdue bill to paid status")
      }
      
      // Update the bill status to paid
      const { error: updateBillError } = await supabase
        .from("bills")
        .update({
          status: "paid",
          last_paid_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", id)
        .eq("user_id", user.id)

      if (updateBillError) {
        console.error("Error updating bill status:", updateBillError)
      }
    }

    // Create bill payment record
    // Determine if the bill is overdue based on the due date
    const isOverdue = bill.next_due_date && new Date(bill.next_due_date) < new Date()
    const paymentNotes = isOverdue ? "Overdue bill marked as paid" : "Marked as paid manually"
    
    // Get payment method from form or default to 'other' if not provided or invalid
    let paymentMethod = formData.get("payment_method") as string || "other"
    
    // Ensure payment_method is one of the valid enum values
    const validPaymentMethods = ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'other']
    if (!validPaymentMethods.includes(paymentMethod)) {
      paymentMethod = "other"
    }
    
    const { error: paymentError } = await supabase.from("bill_payments").insert({
      bill_id: id,
      user_id: user.id,
      amount_paid: bill.amount_due || bill.amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
      note: paymentNotes
    })

    if (paymentError) {
      console.error("Error creating bill payment:", paymentError)
    }

    // First mark the bill as paid
    const { error: updateError } = await supabase
      .from("bills")
      .update({
        status: "paid",
        last_paid_date: new Date().toISOString().split('T')[0]
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating bill status:", updateError)
      throw new Error("Failed to update bill status")
    }
    
    // Create payment schedule entry for record-keeping
    if (supabase) {
      const { error: scheduleError } = await supabase.from("bill_payments").insert({
        bill_id: id,
        user_id: user.id,
        amount_paid: bill.amount_due || bill.amount,
        payment_date: new Date().toISOString().split('T')[0], // Today's date as payment date
        payment_method: paymentMethod,
        note: "Payment recorded"
      })

      if (scheduleError) {
        console.error("Error creating payment schedule:", scheduleError)
        // Don't throw here, we've already updated the bill status
      }
    }
    
    // For recurring bills, create a new bill entry for the next cycle instead of updating the current one
    if (bill.frequency && bill.frequency !== 'once' && supabase) {
      // Calculate the next due date based on the frequency
      const nextDueDate = calculateNextDueDate(bill.next_due_date || '', bill.frequency);
      console.log(`Recurring bill paid. Next cycle due date: ${nextDueDate}`);
      
      // Keep the current bill as paid and don't modify its due date
      // This preserves the user's original input and payment history
      console.log(`Keeping original bill as paid with due date: ${bill.next_due_date}`);
      
      // We could optionally create a new bill entry for the next cycle here
      // But for now, we'll keep the original bill as is and let the user manually create the next one
      // This gives the user complete control over their bill management
    } else {
      console.log(`Non-recurring bill marked as paid. Due date remains: ${bill.next_due_date}`);
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
    case "once":
      // For one-time bills, don't change the date
      break
    case "weekly":
      date.setDate(date.getDate() + 7)
      break
    case "biweekly":
    case "bi_weekly":
      date.setDate(date.getDate() + 14)
      break
    case "monthly":
      date.setMonth(date.getMonth() + 1)
      break
    case "quarterly":
      date.setMonth(date.getMonth() + 3)
      break
    case "semi-annually":
    case "semiannually":
    case "semi_annual":
      date.setMonth(date.getMonth() + 6)
      break
    case "annually":
    case "annual":
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
