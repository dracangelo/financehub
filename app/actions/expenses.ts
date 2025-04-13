"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/server"
import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"
import { Expense } from "@/types/expense"
import { formatExpense, formatExpenseForCalendar, getExpenseSummaryByDay } from "@/lib/expense-utils"

// Interface for location search parameters
export interface LocationSearchParams {
  latitude: number;
  longitude: number;
  radiusMeters?: number; // Default will be 1000 meters (1km)
  locationName?: string; // Optional location name for display
}

// Get all expenses with location data
export async function getExpenses(locationSearch?: LocationSearchParams) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      console.log("No authenticated user found")
      return []
    }

    // Build the query
    let query = supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
    
    // Add location filter if provided
    if (locationSearch && locationSearch.latitude && locationSearch.longitude) {
      const radius = locationSearch.radiusMeters || 1000; // Default to 1km if not specified
      const point = `POINT(${locationSearch.longitude} ${locationSearch.latitude})`;
      
      // Use PostGIS ST_DWithin to find expenses within the radius
      // Note: ST_DWithin with geography type measures in meters
      query = query.filter(
        'location', 
        'st_dwithin', 
        `CAST(ST_SetSRID(ST_GeomFromText('${point}'), 4326) AS geography),${radius}`
      );
    }
    
    // Execute the query
    const { data, error } = await query
      .order("spent_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error fetching expenses:", error)
      return []
    }

    // Map the expenses to include the category information from our constants
    // instead of trying to join with a non-existent categories table
    return data;
  } catch (error) {
    console.error("Unexpected error in getExpenses:", error)
    return []
  }
}

// Search expenses by location
export async function searchExpensesByLocation(params: LocationSearchParams) {
  return getExpenses(params);
}

// Get expense by ID
export async function getExpenseById(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching expense:", error)
      throw new Error("Failed to fetch expense")
    }

    if (!data) {
      notFound()
    }

    return data as Expense
  } catch (error) {
    console.error("Error in getExpenseById:", error)
    throw new Error("Failed to fetch expense")
  }
}

// Create a new expense with advanced features
export async function createExpense(expenseData: {
  merchant_name?: string | null;
  amount: number;
  category_id: string;
  description: string;
  spent_at: Date;
  location?: { latitude: number; longitude: number } | null;
  is_recurring?: boolean;
  is_impulse?: boolean;
  notes?: string | null;
  receipt_url?: string | null;
  warranty_expiry?: Date | null;
  split_with_name?: string | null;
  split_amount?: number | null;
}) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // Prepare the expense data for insertion
    const insertData = {
      user_id: user.id,
      merchant_name: expenseData.merchant_name || null,
      amount: expenseData.amount,
      category: expenseData.category_id,
      description: expenseData.description,
      spent_at: expenseData.spent_at.toISOString(),
      location: expenseData.location ? 
        `POINT(${expenseData.location.longitude} ${expenseData.location.latitude})` : 
        null,
      is_recurring: expenseData.is_recurring || false,
      notes: expenseData.notes || null,
      receipt_url: expenseData.receipt_url || null,
      warranty_expiry: expenseData.warranty_expiry?.toISOString() || null
    }

    // Create merchant if needed
    let merchant_id = null
    if (expenseData.merchant_name) {
      const { data: existingMerchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("name", expenseData.merchant_name)
        .single()

      if (existingMerchant) {
        merchant_id = existingMerchant.id
      } else {
        const { data: newMerchant } = await supabase
          .from("merchants")
          .insert({ name: expenseData.merchant_name })
          .select("id")
          .single()

        if (newMerchant) {
          merchant_id = newMerchant.id
        }
      }
    }

    // Create the expense
    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        ...insertData,
        merchant_id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating expense:", error)
      throw new Error("Failed to create expense")
    }

    // Handle split expense if applicable
    if (expenseData.split_with_name && expenseData.split_amount) {
      try {
        const { error: splitError } = await supabase.from("expense_splits").insert({
          expense_id: expense.id,
          shared_with_name: expenseData.split_with_name, // Use name instead of user ID
          amount: expenseData.split_amount,
          status: 'pending'
        })
        if (splitError) {
          console.error("Error creating split expense:", splitError)
        }
      } catch (error) {
        console.error("Error creating split expense:", error)
        // We'll continue even if split creation fails
      }
    }

    // Check for recurring patterns
    if (expenseData.merchant_name && !expenseData.is_recurring) {
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: previousTransactions } = await supabase
          .from('expenses')
          .select('spent_at')
          .eq('merchant_id', merchant_id)
          .eq('user_id', user.id)
          .gte('spent_at', thirtyDaysAgo.toISOString())
          .order('spent_at', { ascending: false })

        if (previousTransactions && previousTransactions.length >= 2) {
          // If there are 2 or more transactions in the last 30 days, suggest marking as recurring
          await supabase
            .from('expenses')
            .update({ is_recurring: true })
            .eq('id', expense.id)
        }
      } catch (error) {
        console.error("Error checking recurring pattern:", error)
        // Continue even if recurring check fails
      }
    }

    // Update merchant intelligence data
    if (expenseData.merchant_name) {
      try {
        await updateMerchantIntelligence(
          user.id,
          expenseData.merchant_name,
          expenseData.amount,
          expenseData.spent_at.toISOString(),
          expenseData.category_id
        )
        // Also revalidate merchant intelligence pages
        revalidatePath("/merchants")
      } catch (error) {
        console.error("Error updating merchant intelligence:", error)
        // Continue even if merchant intelligence update fails
      }
    }

    // Revalidate all paths that display expense data
    revalidatePath("/expenses")
    revalidatePath("/dashboard")
    revalidatePath("/categories")
    revalidatePath("/analytics")
    revalidatePath("/receipts")
    revalidatePath("/splits")

    return expense
  } catch (error: any) {
    console.error("Error in createExpense:", error)
    throw new Error(`Failed to create expense: ${error.message || 'Unknown error'}`)
  }
}

// Update an existing expense with enhanced features
export async function updateExpense(id: string, expenseData: any) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    console.log("Updating expense with data:", expenseData)

    // Extract basic expense data directly from the input object
    const merchant_name = expenseData.merchant_name || null
    const amount = typeof expenseData.amount === 'number' ? expenseData.amount : parseFloat(expenseData.amount)
    // Store the actual category ID or name from the form
    const category = expenseData.category_id || null  // Map category_id from form to category in database, note that this is the actual category ID or name used for the expense
    const description = expenseData.description
    const spent_at = expenseData.spent_at
    const latitude = expenseData.latitude || null
    const longitude = expenseData.longitude || null
    const is_recurring = !!expenseData.is_recurring
    const notes = expenseData.notes || null
    const is_impulse = !!expenseData.is_impulse
    const warranty_expiry = expenseData.warranty_expiry || null
    const receipt_url = expenseData.receipt_url || null
    const split_with_name = expenseData.split_with_name || null
    const split_amount = expenseData.split_amount || null

    // First, get the existing expense to compare changes
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
      
    if (fetchError) {
      console.error("Error fetching existing expense:", fetchError)
      throw new Error("Failed to fetch existing expense")
    }

    if (!existingExpense) {
      throw new Error("Expense not found")
    }
    
    // Validate required fields - check if values exist or use existing values as fallback
    // This allows partial updates where not all fields are required
    const finalAmount = isNaN(amount) ? existingExpense.amount : amount;
    const finalDescription = description || existingExpense.description;
    const finalSpentAt = spent_at || existingExpense.spent_at;
    
    if (!finalAmount) {
      throw new Error("Missing required field: amount")
    }
    
    if (!finalDescription) {
      throw new Error("Missing required field: description")
    }
    
    if (!finalSpentAt) {
      throw new Error("Missing required field: spent_at")
    }

    // Create or update merchant if provided
    let merchant_id = existingExpense.merchant_id
    if (merchant_name) {
      const { data: merchantData, error: merchantError } = await supabase
        .from("merchants")
        .upsert({
          name: merchant_name,
          category: category
        }, {
          onConflict: 'name',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (!merchantError && merchantData) {
        merchant_id = merchantData.id
        
        // Update merchant intelligence data
        try {
          const { data: merchantInsights } = await supabase
            .from("merchants")
            .select("avg_monthly_spend, insights")
            .eq("id", merchant_id)
            .single()
            
          if (merchantInsights) {
            // Calculate new average monthly spend
            const oldAvg = merchantInsights.avg_monthly_spend || 0
            const oldInsights = merchantInsights.insights || {}
            const transactionCount = oldInsights.transaction_count || 1 // Minimum 1 to avoid divide by zero
            const newAvg = (oldAvg * transactionCount + amount) / (transactionCount + 1)
            
            // Update merchant with new insights
            await supabase
              .from("merchants")
              .update({
                avg_monthly_spend: newAvg,
                insights: {
                  ...oldInsights,
                  transaction_count: transactionCount + 1,
                  last_transaction_date: new Date().toISOString(),
                  categories: [...(oldInsights.categories || []), category].filter(Boolean)
                }
              })
              .eq("id", merchant_id)
          }
        } catch (insightError) {
          console.error("Error updating merchant insights:", insightError)
          // Continue even if merchant insight update fails
        }
      }
    }

    // Create location point if latitude and longitude are provided
    let location = existingExpense.location
    if (latitude !== null && longitude !== null) {
      // For PostGIS geography(Point, 4326) type, we need to use the correct format
      // Supabase expects a WKT (Well-Known Text) string for geography types
      location = `POINT(${longitude} ${latitude})`
    }

    // Update the expense
    const updateData: any = {
      amount,
      category: category, // schema uses category as text field, not category_id
      description,
      location,
      spent_at: new Date(spent_at).toISOString(),
      is_recurring,
      merchant_id
    }
    const { data, error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating expense:", error)
      throw new Error("Failed to update expense")
    }
    
    // Process receipt if provided
    if (data.receipt_url) {
      try {
        // Check if there's an existing receipt
        const { data: existingReceipt } = await supabase
          .from('receipts')
          .select('id, image_url')
          .eq('expense_id', id)
          .single()
          
        // Upload receipt image to storage
        const filename = `${user.id}/${id}/${Date.now()}-receipt`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filename, data.receipt_url)
          
        if (uploadError) throw uploadError
        
        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(filename)
          
        if (existingReceipt) {
          // Update existing receipt
          const { error: receiptError } = await supabase
            .from('receipts')
            .update({
              image_url: urlData?.publicUrl,
              warranty_expiry: warranty_expiry ? new Date(warranty_expiry).toISOString() : null,
              receipt_date: new Date(spent_at).toISOString().split('T')[0]
            })
            .eq('id', existingReceipt.id)
            
          if (receiptError) throw receiptError
          
          // Delete old receipt file if it exists
          if (existingReceipt.image_url) {
            const oldPath = existingReceipt.image_url.split('/').slice(-2).join('/')
            await supabase.storage.from('receipts').remove([oldPath])
          }
        } else {
          // Create new receipt record
          const { error: receiptError } = await supabase
            .from('receipts')
            .insert({
              expense_id: id,
              image_url: urlData?.publicUrl,
              warranty_expiry: warranty_expiry ? new Date(warranty_expiry).toISOString() : null,
              receipt_date: new Date(spent_at).toISOString().split('T')[0]
            })
            
          if (receiptError) throw receiptError
        }
      } catch (receiptError) {
        console.error("Error processing receipt:", receiptError)
        // Continue even if receipt processing fails
      }
    }
    
    // Process split expense if applicable
    if (split_with_name && split_amount) {
      try {
        // Check if there's an existing split
        const { data: existingSplit } = await supabase
          .from('expense_splits')
          .select('id')
          .eq('expense_id', id)
          .single()
          
        if (existingSplit) {
          // Update existing split
          const { error: splitError } = await supabase
            .from('expense_splits')
            .update({
              shared_with_name: split_with_name,
              amount: split_amount,
              status: 'pending' // Reset status since details changed
            })
            .eq('id', existingSplit.id)
            
          if (splitError) throw splitError
        } else {
          // Create new split
          const { error: splitError } = await supabase
            .from('expense_splits')
            .insert({
              expense_id: id,
              shared_with_name: split_with_name,
              amount: split_amount,
              status: 'pending'
            })
            
          if (splitError) throw splitError
        }
      } catch (splitError) {
        console.error("Error processing split expense:", splitError)
        // Continue even if split processing fails
      }
    }

    // Update merchant intelligence if merchant name changed or amount changed
    if (merchant_name && (merchant_name !== existingExpense.merchant_name || amount !== existingExpense.amount)) {
      try {
        await updateMerchantIntelligence(
          user.id,
          merchant_name,
          amount,
          spent_at,
          category
        )
        // Also revalidate merchant intelligence pages
        revalidatePath("/merchants")
      } catch (error) {
        console.error("Error updating merchant intelligence:", error)
        // Continue even if merchant intelligence update fails
      }
    }

    // Revalidate all paths that display expense data
    revalidatePath("/expenses")
    revalidatePath(`/expenses/${id}`)
    revalidatePath("/dashboard")
    revalidatePath("/categories")
    revalidatePath("/analytics")
    revalidatePath("/receipts")
    revalidatePath("/splits")

    return data
  } catch (error) {
    console.error("Error in updateExpense:", error)
    throw new Error("Failed to update expense")
  }
}

// Delete an expense with comprehensive cleanup
export async function deleteExpense(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // First, get the expense details to handle related data
    const { data: expense, error: fetchError } = await supabase
      .from("expenses")
      .select("id, merchant_id, category, amount")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching expense for deletion:", fetchError)
      throw new Error("Failed to fetch expense for deletion")
    }

    // Handle receipt cleanup first
    try {
      // Get receipt info
      const { data: receiptData } = await supabase
        .from("receipts")
        .select("id, image_url")
        .eq("expense_id", id)

      if (receiptData && receiptData.length > 0) {
        // Delete receipt files from storage
        for (const receipt of receiptData) {
          if (receipt.image_url) {
            // Extract the path from the URL
            const urlParts = receipt.image_url.split('/')
            const storagePath = urlParts.slice(-3).join('/')
            
            // Delete the file
            await supabase.storage
              .from('receipts')
              .remove([storagePath])
          }
        }

        // Delete receipt records
        await supabase
          .from("receipts")
          .delete()
          .eq("expense_id", id)
      }
    } catch (receiptError) {
      console.error("Error cleaning up receipts:", receiptError)
      // Continue with deletion even if receipt cleanup fails
    }

    // Handle split expense cleanup
    try {
      await supabase
        .from("expense_splits")
        .delete()
        .eq("expense_id", id)
    } catch (splitError) {
      console.error("Error cleaning up expense splits:", splitError)
      // Continue with deletion even if split cleanup fails
    }

    // Handle voice memo cleanup
    try {
      // Get voice memo info
      const { data: memoData } = await supabase
        .from("voice_memos")
        .select("id, audio_url")
        .eq("expense_id", id)

      if (memoData && memoData.length > 0) {
        // Delete audio files from storage
        for (const memo of memoData) {
          if (memo.audio_url) {
            // Extract the path from the URL
            const urlParts = memo.audio_url.split('/')
            const storagePath = urlParts.slice(-3).join('/')
            
            // Delete the file
            await supabase.storage
              .from('voice_memos')
              .remove([storagePath])
          }
        }

        // Delete voice memo records
        await supabase
          .from("voice_memos")
          .delete()
          .eq("expense_id", id)
      }
    } catch (memoError) {
      console.error("Error cleaning up voice memos:", memoError)
      // Continue with deletion even if memo cleanup fails
    }

    // Update merchant intelligence if applicable
    if (expense.merchant_id) {
      try {
        const { data: merchantData } = await supabase
          .from("merchants")
          .select("avg_monthly_spend, insights")
          .eq("id", expense.merchant_id)
          .single()

        if (merchantData) {
          // Update merchant intelligence
          const oldAvg = merchantData.avg_monthly_spend || 0
          const oldInsights = merchantData.insights || {}
          const transactionCount = oldInsights.transaction_count || 1 // Minimum 1 to avoid divide by zero
          
          // Recalculate average without this expense
          const newAvg = transactionCount > 1 
            ? ((oldAvg * transactionCount) - expense.amount) / (transactionCount - 1)
            : 0

          await supabase
            .from("merchants")
            .update({
              avg_monthly_spend: newAvg,
              insights: {
                ...oldInsights,
                transaction_count: Math.max(0, (transactionCount - 1)),
                last_deleted_at: new Date().toISOString()
              }
            })
            .eq("id", expense.merchant_id)
        }
      } catch (merchantError) {
        console.error("Error updating merchant data after deletion:", merchantError)
        // Continue with deletion even if merchant update fails
      }
    }

    // Finally, delete the expense
    const { data, error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting expense:", error)
      throw new Error("Failed to delete expense")
    }

    // Revalidate all paths that display expense data
    revalidatePath("/expenses")
    revalidatePath("/dashboard")
    revalidatePath("/categories")
    revalidatePath("/analytics")
    revalidatePath("/receipts")
    revalidatePath("/splits")

    return { success: true, message: "Expense and all related data deleted successfully" }
  } catch (error) {
    console.error("Error in deleteExpense:", error)
    throw error
  }
}

// Get expenses by time period
export async function getExpensesByPeriod(period: "current" | "day" | "week" | "month" | "year" = "month") {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate: string

    if (period === "current") {
      // Current month: from the 1st day of the current month to now
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate = firstDayOfMonth.toISOString().split("T")[0]
    } else if (period === "day") {
      startDate = now.toISOString().split("T")[0]
    } else if (period === "week") {
      const lastWeek = new Date(now)
      lastWeek.setDate(now.getDate() - 7)
      startDate = lastWeek.toISOString().split("T")[0]
    } else if (period === "month") {
      const lastMonth = new Date(now)
      lastMonth.setMonth(now.getMonth() - 1)
      startDate = lastMonth.toISOString().split("T")[0]
    } else {
      const lastYear = new Date(now)
      lastYear.setFullYear(now.getFullYear() - 1)
      startDate = lastYear.toISOString().split("T")[0]
    }

    // Query expenses directly with date range
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .gte("spent_at", startDate)
      .lte("spent_at", now.toISOString())
      .order("spent_at", { ascending: false })

    if (error) {
      console.error("Error fetching expenses by period:", error)
      return []
    }

    // Fetch related data
    const expensesWithRelations = await Promise.all(
      data.map(async (expense) => {
        const [accountData, categoryData] = await Promise.all([
          supabase
            .from('accounts')
            .select('id, name, type, institution')
            .eq('id', expense.account_id)
            .single(),
          supabase
            .from('categories')
            .select('id, name, color, icon, is_income')
            .eq('id', expense.category_id)
            .single()
        ])

        return {
          ...expense,
          account: accountData.data,
          category: categoryData.data
        }
      })
    )

    return expensesWithRelations
  } catch (error) {
    console.error("Unexpected error in getExpensesByPeriod:", error)
    return []
  }
}

// Get expenses by category
export async function getExpensesByCategory(categoryId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        account:accounts(id, name, type, institution),
        category:categories(id, name, color, icon, is_income)
      `)
      .eq("user_id", user.id)
      .eq("is_income", false)
      .eq("category_id", categoryId)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching expenses by category:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getExpensesByCategory:", error)
    return []
  }
}

// Get expenses by merchant
export async function getExpensesByMerchant(merchant: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        account:accounts(id, name, type, institution),
        category:categories(id, name, color, icon, is_income)
      `)
      .eq("user_id", user.id)
      .eq("is_income", false)
      .ilike("description", `%${merchant}%`)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching expenses by merchant:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getExpensesByMerchant:", error)
    return []
  }
}

// Get expenses with location data
export async function getExpensesWithLocation() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        account:accounts(id, name, type, institution),
        category:categories(id, name, color, icon, is_income)
      `)
      .eq("user_id", user.id)
      .eq("is_income", false)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching expenses with location:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getExpensesWithLocation:", error)
    return []
  }
}

// Get recurring expenses
export async function getRecurringExpenses() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        account:accounts(id, name, type, institution),
        category:categories(id, name, color, icon, is_income),
        recurring_pattern:recurring_patterns(id, frequency, confidence, next_expected_date, is_subscription)
      `)
      .eq("user_id", user.id)
      .eq("is_income", false)
      .eq("is_recurring", true)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching recurring expenses:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getRecurringExpenses:", error)
    return []
  }
}

// Get split expenses
export async function getSplitExpenses() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("split_transactions")
      .select(`
        *,
        transaction:transactions(id, description, amount, date, account:accounts(id, name)),
        participants:split_participants(id, name, amount, status, payment_date)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching split expenses:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getSplitExpenses:", error)
    return []
  }
}

// Get time-of-day analysis
export async function getTimeOfDayAnalysis() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    // Get all expenses with time_of_day
    const { data, error } = await supabase
      .from("expenses")
      .select("amount, spent_at, isImpulse, category")
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching time of day data:", error)
      return []
    }

    // Group by time of day
    const timeOfDayGroups: Record<string, { total: number, count: number, impulse_count: number }> = {
      'Morning': { total: 0, count: 0, impulse_count: 0 },
      'Afternoon': { total: 0, count: 0, impulse_count: 0 },
      'Evening': { total: 0, count: 0, impulse_count: 0 },
      'Late Night': { total: 0, count: 0, impulse_count: 0 }
    }

    // Determine time of day for each expense
    data.forEach(expense => {
      const hour = new Date(expense.spent_at).getHours()
      let timeOfDay = 'Afternoon' // Default
      
      if (hour >= 0 && hour < 6) {
        timeOfDay = 'Late Night'
      } else if (hour >= 6 && hour < 12) {
        timeOfDay = 'Morning'
      } else if (hour >= 12 && hour < 18) {
        timeOfDay = 'Afternoon'
      } else {
        timeOfDay = 'Evening'
      }
      
      if (timeOfDayGroups[timeOfDay]) {
        timeOfDayGroups[timeOfDay].total += expense.amount
        timeOfDayGroups[timeOfDay].count += 1
        if (expense.isImpulse) {
          timeOfDayGroups[timeOfDay].impulse_count += 1
        }
      }
    })

    // Convert to array format for visualization
    return Object.entries(timeOfDayGroups).map(([time, stats]) => ({
      time_of_day: time,
      total_amount: stats.total,
      transaction_count: stats.count,
      impulse_count: stats.impulse_count,
      impulse_percentage: stats.count > 0 ? (stats.impulse_count / stats.count) * 100 : 0,
      average_amount: stats.count > 0 ? stats.total / stats.count : 0
    }))
  } catch (error) {
    console.error("Unexpected error in getTimeOfDayAnalysis:", error)
    return []
  }
}

// Get recurring patterns - helper function
async function getRecurringPatterns() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    // Get recurring patterns
    const { data: patterns, error: patternsError } = await supabase
      .from("recurring_patterns")
      .select(`
        *,
        merchant:merchants(id, name, category)
      `)
      .eq("user_id", user.id)

    if (patternsError) {
      console.error("Error fetching recurring patterns:", patternsError)
      return []
    }

    // Get the most recent expense for each recurring pattern
    const enhancedPatterns = await Promise.all(patterns.map(async (pattern) => {
      const { data: recentExpenses, error: expensesError } = await supabase
        .from("expenses")
        .select("id, amount, spent_at")
        .eq("user_id", user.id)
        .eq("merchant_id", pattern.merchant_id)
        .eq("is_recurring", true)
        .order("spent_at", { ascending: false })
        .limit(1)

      if (expensesError || !recentExpenses || recentExpenses.length === 0) {
        return pattern
      }

      return {
        ...pattern,
        last_expense: recentExpenses[0],
        next_due_days: Math.ceil(
          (new Date(pattern.next_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      }
    }))

    return enhancedPatterns
  } catch (error) {
    console.error("Unexpected error in getRecurringExpenses:", error)
    return []
  }
}

// Get merchant intelligence data
export async function getMerchantIntelligence(merchantId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return null
    }

    // Get merchant details
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", merchantId)
      .single()

    if (merchantError) {
      console.error("Error fetching merchant:", merchantError)
      return null
    }

    // Get all expenses for this merchant
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("amount, spent_at, isImpulse, category")
      .eq("user_id", user.id)
      .eq("merchant_id", merchantId)
      .order("spent_at", { ascending: false })

    if (expensesError) {
      console.error("Error fetching merchant expenses:", expensesError)
      return null
    }

    // Calculate intelligence metrics
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const averageSpend = totalSpent / (expenses.length || 1)
    const impulseCount = expenses.filter(exp => exp.isImpulse).length
    const impulsePercentage = (impulseCount / (expenses.length || 1)) * 100

    // Analyze spending frequency
    const dates = expenses.map(exp => new Date(exp.spent_at).toISOString().split('T')[0])
    const uniqueDates = [...new Set(dates)]
    const frequencyDays = dates.length > 1 ? 
      Math.round((new Date(dates[0]).getTime() - new Date(dates[dates.length - 1]).getTime()) / (1000 * 60 * 60 * 24 * (uniqueDates.length - 1))) : 
      0

    // Update merchant insights
    const insights = {
      total_spent: totalSpent,
      average_spend: averageSpend,
      visit_count: expenses.length,
      impulse_percentage: impulsePercentage,
      frequency_days: frequencyDays,
      last_visit: dates[0],
      categories: [...new Set(expenses.map(exp => exp.category))]
    }

    await supabase
      .from("merchants")
      .update({
        avg_monthly_spend: averageSpend,
        insights
      })
      .eq("id", merchantId)

    return {
      merchant,
      insights
    }
  } catch (error) {
    console.error("Unexpected error in getMerchantIntelligence:", error)
    return null
  }
}

// Get expenses with location data for map visualization
async function getExpensesWithLocationForMap() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    // Get expenses with location data
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        id,
        amount,
        category,
        description,
        location,
        spent_at,
        merchant_id,
        isImpulse
      `)
      .eq("user_id", user.id)
      .not("location", "is", null)
      .order("spent_at", { ascending: false })

    if (error) {
      console.error("Error fetching expenses with location:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getExpensesWithLocation:", error)
    return []
  }
}

// Helper function to analyze recurring patterns
async function analyzeRecurringPattern(
  userId: string,
  description: string,
  amount: number,
  categoryId: string,
  date: string,
  frequency: string,
  intervals: number[],
  avgInterval: number,
  similarTransactions: any[]
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Calculate confidence based on consistency of intervals
    const stdDev = calculateStandardDeviation(intervals)
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / avgInterval) * 50))

    // Calculate next expected date
    const lastDate = new Date(similarTransactions[0].date)
    let nextDate = new Date(lastDate)

    if (frequency === "weekly") {
      nextDate.setDate(lastDate.getDate() + 7)
    } else if (frequency === "bi-weekly") {
      nextDate.setDate(lastDate.getDate() + 14)
    } else if (frequency === "monthly") {
      nextDate.setMonth(lastDate.getMonth() + 1)
    } else if (frequency === "quarterly") {
      nextDate.setMonth(lastDate.getMonth() + 3)
    } else if (frequency === "yearly") {
      nextDate.setFullYear(lastDate.getFullYear() + 1)
    }

    // Check if pattern already exists
    const { data: existingPattern } = await supabase
      .from("recurring_patterns")
      .select("*")
      .eq("user_id", userId)
      .eq("merchant", description)
      .single()

    if (existingPattern) {
      // Update existing pattern
      await supabase
        .from("recurring_patterns")
        .update({
          amount,
          category_id: categoryId,
          frequency,
          confidence,
          last_transaction_date: date,
          next_expected_date: nextDate.toISOString().split("T")[0],
        })
        .eq("id", existingPattern.id)
    } else {
      // Create new pattern
      await supabase.from("recurring_patterns").insert({
        user_id: userId,
        merchant: description,
        category_id: categoryId,
        amount,
        frequency,
        confidence,
        last_transaction_date: date,
        next_expected_date: nextDate.toISOString().split("T")[0],
      })
    }
  } catch (error) {
    console.error("Error analyzing recurring pattern:", error)
  }
}

// Helper function to analyze time of day
async function analyzeTimeOfDay(
  userId: string,
  transactionId: string,
  timeOfDay: string,
  dayOfWeek: number
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Determine if this is an impulse purchase based on time of day and day of week
    // This is a simple heuristic - evening and weekend purchases are more likely to be impulse
    const isImpulse =
      (timeOfDay === "evening" || timeOfDay === "night") && (dayOfWeek === 0 || dayOfWeek === 6)

    // Create time analysis record
    await supabase.from("time_analysis").insert({
      user_id: userId,
      transaction_id: transactionId,
      time_of_day: timeOfDay,
      day_of_week: getDayName(dayOfWeek),
      isImpulse,
    })

    // Update transaction with impulse flag
    await supabase
      .from("transactions")
      .update({ isImpulse })
      .eq("id", transactionId)
  } catch (error) {
    console.error("Error analyzing time of day:", error)
  }
}

// Helper function to update merchant intelligence
async function updateMerchantIntelligence(
  userId: string,
  merchant: string,
  amount: number,
  date: string,
  categoryId: string | null
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check if merchant already exists
    const { data: existingMerchant } = await supabase
      .from("merchant_intelligence")
      .select("*")
      .eq("user_id", userId)
      .eq("merchant_name", merchant)
      .single()

    if (existingMerchant) {
      // Update existing merchant
      const visitCount = existingMerchant.visit_count || 1
      const newVisitCount = visitCount + 1
      const newAverageSpend = (existingMerchant.average_spend * visitCount + amount) / newVisitCount

      await supabase
        .from("merchant_intelligence")
        .update({
          category_id: categoryId,
          visit_count: newVisitCount,
          average_spend: newAverageSpend,
          last_visit_date: date,
        })
        .eq("id", existingMerchant.id)
    } else {
      // Create new merchant
      await supabase.from("merchant_intelligence").insert({
        user_id: userId,
        merchant_name: merchant,
        category_id: categoryId,
        visit_count: 1,
        average_spend: amount,
        last_visit_date: date,
      })
    }
  } catch (error) {
    console.error("Error updating merchant intelligence:", error)
  }
}

// Helper function to calculate standard deviation
function calculateStandardDeviation(values: number[]): number {
  const n = values.length
  const mean = values.reduce((sum, value) => sum + value, 0) / n
  const squareDiffs = values.map((value) => {
    const diff = value - mean
    return diff * diff
  })
  const avgSquareDiff = squareDiffs.reduce((sum, value) => sum + value, 0) / n
  return Math.sqrt(avgSquareDiff)
}

// Helper function to get day name
function getDayName(day: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return days[day]
}

// Utility functions have been moved to lib/expense-utils.ts