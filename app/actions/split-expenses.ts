"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/server"
import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"

// Interface for split expense data
export interface SplitExpenseData {
  expense_id: string
  shared_with_name: string
  amount: number
  status?: 'pending' | 'accepted' | 'rejected'
}

// Get all split expenses for a user
export async function getSplitExpenses() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        expense_splits(*)
      `)
      .eq("user_id", user.id)
      .not("expense_splits", "is", null)
      .order("spent_at", { ascending: false })

    if (error) {
      console.error("Error fetching split expenses:", error)
      throw new Error("Failed to fetch split expenses")
    }

    return data || []
  } catch (error) {
    console.error("Error in getSplitExpenses:", error)
    throw error
  }
}

// Get split expenses for a specific expense
export async function getSplitExpensesByExpenseId(expenseId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // First check if the expense belongs to the user
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select("id")
      .eq("id", expenseId)
      .eq("user_id", user.id)
      .single()

    if (expenseError || !expense) {
      throw new Error("Expense not found or access denied")
    }

    const { data, error } = await supabase
      .from("expense_splits")
      .select("*")
      .eq("expense_id", expenseId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching split expenses:", error)
      throw new Error("Failed to fetch split expenses")
    }

    return data || []
  } catch (error) {
    console.error("Error in getSplitExpensesByExpenseId:", error)
    throw error
  }
}

// Create a split expense
export async function createSplitExpense(splitData: SplitExpenseData) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // First check if the expense belongs to the user
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select("id, amount")
      .eq("id", splitData.expense_id)
      .eq("user_id", user.id)
      .single()

    if (expenseError || !expense) {
      throw new Error("Expense not found or access denied")
    }

    // Validate split amount
    if (splitData.amount <= 0 || splitData.amount > expense.amount) {
      throw new Error("Invalid split amount")
    }

    // Create the split expense
    const { data, error } = await supabase
      .from("expense_splits")
      .insert({
        expense_id: splitData.expense_id,
        shared_with_name: splitData.shared_with_name,
        amount: splitData.amount,
        status: splitData.status || 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating split expense:", error)
      throw new Error("Failed to create split expense")
    }

    // Revalidate the expenses path to update UI
    revalidatePath("/expenses")
    
    return data
  } catch (error) {
    console.error("Error in createSplitExpense:", error)
    throw error
  }
}

// Update a split expense
export async function updateSplitExpense(splitId: string, splitData: Partial<SplitExpenseData>) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // First check if the split expense belongs to the user's expense
    const { data: split, error: splitError } = await supabase
      .from("expense_splits")
      .select("expense_id")
      .eq("id", splitId)
      .single()

    if (splitError || !split) {
      throw new Error("Split expense not found")
    }

    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select("id, amount")
      .eq("id", split.expense_id)
      .eq("user_id", user.id)
      .single()

    if (expenseError || !expense) {
      throw new Error("Access denied")
    }

    // Validate split amount if provided
    if (splitData.amount && (splitData.amount <= 0 || splitData.amount > expense.amount)) {
      throw new Error("Invalid split amount")
    }

    // Update the split expense
    const { data, error } = await supabase
      .from("expense_splits")
      .update({
        shared_with_name: splitData.shared_with_name,
        amount: splitData.amount,
        status: splitData.status
      })
      .eq("id", splitId)
      .select()
      .single()

    if (error) {
      console.error("Error updating split expense:", error)
      throw new Error("Failed to update split expense")
    }

    // Revalidate the expenses path to update UI
    revalidatePath("/expenses")
    
    return data
  } catch (error) {
    console.error("Error in updateSplitExpense:", error)
    throw error
  }
}

// Delete a split expense
export async function deleteSplitExpense(splitId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // First check if the split expense belongs to the user's expense
    const { data: split, error: splitError } = await supabase
      .from("expense_splits")
      .select("expense_id")
      .eq("id", splitId)
      .single()

    if (splitError || !split) {
      throw new Error("Split expense not found")
    }

    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select("id")
      .eq("id", split.expense_id)
      .eq("user_id", user.id)
      .single()

    if (expenseError || !expense) {
      throw new Error("Access denied")
    }

    // Delete the split expense
    const { error } = await supabase
      .from("expense_splits")
      .delete()
      .eq("id", splitId)

    if (error) {
      console.error("Error deleting split expense:", error)
      throw new Error("Failed to delete split expense")
    }

    // Revalidate the expenses path to update UI
    revalidatePath("/expenses")
    
    return { success: true }
  } catch (error) {
    console.error("Error in deleteSplitExpense:", error)
    throw error
  }
}

// Get total amount of pending split expenses
export async function getPendingSplitExpensesTotal() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    const { data, error } = await supabase.rpc('get_pending_split_expenses_total', {
      user_id_param: user.id
    })

    if (error) {
      console.error("Error fetching pending split expenses total:", error)
      
      // Fallback if the RPC function doesn't exist
      const { data: expenses, error: fallbackError } = await supabase
        .from("expenses")
        .select(`
          id,
          expense_splits(amount, status)
        `)
        .eq("user_id", user.id)
        .not("expense_splits", "is", null)

      if (fallbackError) {
        throw new Error("Failed to fetch pending split expenses")
      }

      // Calculate total manually
      const total = expenses?.reduce((sum, expense) => {
        const pendingSplits = expense.expense_splits.filter(split => split.status === 'pending')
        const pendingAmount = pendingSplits.reduce((splitSum, split) => splitSum + split.amount, 0)
        return sum + pendingAmount
      }, 0) || 0

      return total
    }

    return data || 0
  } catch (error) {
    console.error("Error in getPendingSplitExpensesTotal:", error)
    throw error
  }
}
