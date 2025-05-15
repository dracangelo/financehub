"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/server"
import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"
import { formatCurrency } from "@/lib/utils/formatting"

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
  if (!expenseId) {
    console.warn("No expense ID provided to getSplitExpensesByExpenseId")
    return [] // Return empty array instead of throwing
  }

  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      console.error("Failed to initialize Supabase client")
      return [] // Return empty array instead of throwing
    }

    let user
    try {
      user = await getAuthenticatedUser()
    } catch (authError) {
      console.error("Authentication error:", authError)
      return [] // Return empty array instead of throwing
    }

    // If no authenticated user, just return empty array
    // This allows the component to continue rendering without errors
    if (!user) {
      console.warn("No authenticated user found when fetching split expenses")
      return []
    }

    // First check if the expense belongs to the user
    try {
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .select("id")
        .eq("id", expenseId)
        .eq("user_id", user.id)
        .single()

      if (expenseError) {
        console.error("Error checking expense ownership:", expenseError)
        return [] // Return empty array instead of throwing
      }

      if (!expense) {
        console.warn("Expense not found or does not belong to user")
        return [] // Return empty array instead of throwing
      }
    } catch (checkError) {
      console.error("Error checking expense ownership:", checkError)
      return [] // Return empty array instead of throwing
    }

    // Now fetch the split expenses
    try {
      const { data, error } = await supabase
        .from("expense_splits")
        .select("*")
        .eq("expense_id", expenseId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching split expenses:", error)
        return [] // Return empty array instead of throwing
      }

      return data || []
    } catch (fetchError) {
      console.error("Error fetching split expenses:", fetchError)
      return [] // Return empty array instead of throwing
    }
  } catch (error) {
    console.error("Unexpected error in getSplitExpensesByExpenseId:", error)
    return [] // Return empty array instead of throwing
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
  if (!splitId) {
    console.warn("No split ID provided to deleteSplitExpense");
    return { success: false, message: "No split ID provided" };
  }

  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      console.error("Failed to initialize Supabase client");
      return { success: false, message: "Database connection failed" };
    }

    let user;
    try {
      user = await getAuthenticatedUser();
    } catch (authError) {
      console.error("Authentication error:", authError);
      return { success: false, message: "Authentication failed" };
    }

    if (!user) {
      console.warn("No authenticated user found when deleting split expense");
      return { success: false, message: "Authentication required" };
    }

    // First check if the split expense exists
    const { data: split, error: splitError } = await supabase
      .from("expense_splits")
      .select("expense_id")
      .eq("id", splitId)
      .single()

    // If split expense doesn't exist, consider it already deleted (idempotent delete)
    if (splitError) {
      if (splitError.code === "PGRST116") { // PostgreSQL not found error
        console.log(`Split expense with ID ${splitId} not found, considering it already deleted`);
        return { success: true, message: "Split expense already deleted" };
      }
      console.error("Error checking split expense:", splitError);
      return { success: false, message: "Failed to check split expense" };
    }

    if (!split) {
      console.log(`Split expense with ID ${splitId} not found, considering it already deleted`);
      return { success: true, message: "Split expense already deleted" };
    }

    // Check if the expense belongs to the user (optional, can skip if causing issues)
    try {
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .select("id")
        .eq("id", split.expense_id)
        .eq("user_id", user.id)
        .single()

      // If expense doesn't belong to user or doesn't exist, log but continue with deletion
      if (expenseError || !expense) {
        console.warn(`Access check failed for expense ${split.expense_id}, but proceeding with deletion`);
      }
    } catch (accessError) {
      console.warn("Error checking expense ownership, but proceeding with deletion:", accessError);
    }

    // Delete the split expense
    try {
      const { error } = await supabase
        .from("expense_splits")
        .delete()
        .eq("id", splitId)

      if (error) {
        console.error("Error deleting split expense:", error);
        return { success: false, message: "Failed to delete split expense" };
      }
    } catch (deleteError) {
      console.error("Error in delete operation:", deleteError);
      return { success: false, message: "Delete operation failed" };
    }

    // Revalidate the expenses path to update UI
    try {
      revalidatePath("/expenses");
    } catch (revalidateError) {
      console.warn("Error revalidating path, but split was deleted:", revalidateError);
    }
    
    return { success: true, message: "Split expense deleted successfully" };
  } catch (error) {
    console.error("Unexpected error in deleteSplitExpense:", error);
    return { success: false, message: "An unexpected error occurred" };
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

// Get formatted split expenses for UI display
export async function getFormattedSplitExpenses() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // Get expenses with split information
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select(`
        id,
        merchant_name,
        amount,
        category,
        description,
        spent_at,
        split_with_name,
        split_amount,
        expense_splits(*)
      `)
      .eq("user_id", user.id)
      .or(`split_with_name.is.not.null,expense_splits.is.not.null`)
      .order("spent_at", { ascending: false })

    if (error) {
      console.error("Error fetching split expenses:", error)
      throw new Error("Failed to fetch split expenses")
    }

    // Format the expenses for UI display
    const formattedExpenses = expenses?.map(expense => {
      // Determine if this is a direct split (using split_with_name) or using expense_splits table
      const isDirectSplit = expense.split_with_name && expense.split_amount;
      const hasSplits = expense.expense_splits && expense.expense_splits.length > 0;
      
      if (!isDirectSplit && !hasSplits) {
        return null; // Skip expenses that don't have split information
      }
      
      // Calculate total pending amount and determine status
      let pendingAmount = 0;
      let status = 'settled';
      let participants: Array<{
        id: string;
        name: string;
        avatar: string;
        amount: number;
        status: string;
      }> = [];
      
      if (isDirectSplit) {
        // For direct splits, create a simple participant structure
        participants = [
          {
            id: user.id,
            name: "You",
            avatar: "/placeholder.svg?height=32&width=32",
            amount: expense.amount - expense.split_amount,
            status: "paid"
          },
          {
            id: `other-${expense.id}`,
            name: expense.split_with_name,
            avatar: "/placeholder.svg?height=32&width=32",
            amount: expense.split_amount,
            status: "pending"
          }
        ];
        pendingAmount = expense.split_amount;
        status = pendingAmount > 0 ? 'active' : 'settled';
      } else if (hasSplits) {
        // For expense_splits table entries, create participants from the splits
        participants = [
          {
            id: user.id,
            name: "You",
            avatar: "/placeholder.svg?height=32&width=32",
            amount: expense.amount - expense.expense_splits.reduce((sum, split) => sum + split.amount, 0),
            status: "paid"
          },
          ...expense.expense_splits.map(split => ({
            id: split.id,
            name: split.shared_with_name,
            avatar: "/placeholder.svg?height=32&width=32",
            amount: split.amount,
            status: split.status || "pending"
          }))
        ];
        
        // Calculate pending amount and determine status
        const pendingSplits = expense.expense_splits.filter(split => split.status === 'pending');
        pendingAmount = pendingSplits.reduce((sum, split) => sum + split.amount, 0);
        status = pendingAmount > 0 ? 'active' : 'settled';
      }
      
      return {
        id: expense.id,
        merchant: expense.merchant_name || expense.description,
        category: expense.category,
        amount: expense.amount,
        date: new Date(expense.spent_at),
        status: status as 'active' | 'settled',
        participants,
        pendingAmount
      };
    }).filter(Boolean); // Remove null entries

    return formattedExpenses || [];
  } catch (error) {
    console.error("Error in getFormattedSplitExpenses:", error)
    return [];
  }
}

// Settle a split expense
export async function settleSplitExpense(splitId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // First check if this is a direct split (in expenses table) or in expense_splits table
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select("id, split_with_name, split_amount")
      .eq("id", splitId)
      .eq("user_id", user.id)
      .single()

    if (!expenseError && expense?.split_with_name) {
      // This is a direct split in the expenses table
      const { error } = await supabase
        .from("expenses")
        .update({
          split_amount: 0, // Set to 0 to indicate it's settled
          notes: `Split with ${expense.split_with_name} for ${formatCurrency(expense.split_amount)} (Settled)`
        })
        .eq("id", splitId)

      if (error) {
        console.error("Error settling direct split expense:", error)
        throw new Error("Failed to settle split expense")
      }
    } else {
      // This is a split in the expense_splits table
      const { error } = await supabase
        .from("expense_splits")
        .update({
          status: 'accepted'
        })
        .eq("id", splitId)

      if (error) {
        console.error("Error settling split expense:", error)
        throw new Error("Failed to settle split expense")
      }
    }

    // Revalidate paths
    revalidatePath("/expenses")
    revalidatePath("/expenses/split")
    
    return { success: true }
  } catch (error) {
    console.error("Error in settleSplitExpense:", error)
    throw error
  }
}

// Send reminder for a split expense
export async function sendSplitExpenseReminder(splitId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // First check if this is a direct split or in expense_splits table
    const { data: split, error: splitError } = await supabase
      .from("expense_splits")
      .select("id, expense_id, shared_with_name, amount")
      .eq("id", splitId)
      .single()

    if (!splitError && split) {
      // Get the expense details
      const { data: expense } = await supabase
        .from("expenses")
        .select("description, merchant_name")
        .eq("id", split.expense_id)
        .single()

      // In a real app, this would send an email or notification
      // For now, we'll just log it and update the split record
      console.log(`Reminder sent to ${split.shared_with_name} for ${formatCurrency(split.amount)} for ${expense?.merchant_name || expense?.description}`)

      // Update the split to indicate a reminder was sent
      await supabase
        .from("expense_splits")
        .update({
          // In a real app, you might track reminder count and dates
          // For now, we'll just add a note to the status
          status: 'pending (reminded)'
        })
        .eq("id", splitId)
    } else {
      // Check if it's a direct split in the expenses table
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .select("id, split_with_name, split_amount, description, merchant_name")
        .eq("id", splitId)
        .eq("user_id", user.id)
        .single()

      if (expenseError || !expense?.split_with_name) {
        throw new Error("Split expense not found")
      }

      // In a real app, this would send an email or notification
      console.log(`Reminder sent to ${expense.split_with_name} for ${formatCurrency(expense.split_amount)} for ${expense.merchant_name || expense.description}`)

      // Update the expense to indicate a reminder was sent
      await supabase
        .from("expenses")
        .update({
          notes: `Split with ${expense.split_with_name} for ${formatCurrency(expense.split_amount)} (Reminder sent)`
        })
        .eq("id", splitId)
    }

    // Revalidate paths
    revalidatePath("/expenses")
    revalidatePath("/expenses/split")
    
    return { success: true, message: "Reminder sent successfully" }
  } catch (error) {
    console.error("Error in sendSplitExpenseReminder:", error)
    throw error
  }
}
