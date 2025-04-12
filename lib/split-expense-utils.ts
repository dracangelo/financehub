"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/server"

/**
 * Create a split expense
 */
export async function createSplitExpense(
  expenseId: string,
  sharedWithUserId: string,
  amount: number
) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()
    
    if (!user) {
      throw new Error("Authentication required")
    }
    
    // Create the split expense record
    const { data, error } = await supabase
      .from('expense_splits')
      .insert({
        expense_id: expenseId,
        shared_with: sharedWithUserId,
        amount,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Error creating split expense: ${error.message}`)
    }
    
    return data
  } catch (error: any) {
    console.error("Error in createSplitExpense:", error)
    throw new Error(`Failed to create split expense: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Create a split expense from form data
 * This simplified version stores the split information in the expense notes
 * rather than creating separate records in the database
 */
export async function createSplitExpenseFromForm(data: {
  sharedWithName: string;
  amount: number;
  description: string;
  date: string;
}) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()
    
    if (!user) {
      throw new Error("Authentication required")
    }
    
    // Create an expense record with split information in the notes
    const splitNote = `Split with ${data.sharedWithName} for ${data.amount.toFixed(2)}`;
    const fullDescription = `${data.description} (${splitNote})`;
    
    // First check if the expenses table has a notes column
    const { data: tableInfo, error: tableError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error("Error checking expenses table schema:", tableError);
      throw new Error(`Error checking expenses table schema: ${tableError.message}`);
    }
    
    // Create the expense record
    const expenseData = {
      user_id: user.id,
      amount: data.amount,
      description: fullDescription,
      spent_at: new Date(data.date).toISOString(),
      category: 'Split'
    };
    
    // Only add notes if the column exists in the table
    // This is a workaround for the schema issue
    if ('notes' in (tableInfo?.[0] || {})) {
      (expenseData as any).notes = splitNote;
    }
    
    const { data: createdExpense, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()
    
    if (expenseError) {
      throw new Error(`Error creating split expense: ${expenseError.message}`)
    }
    
    return createdExpense.id
  } catch (error: any) {
    console.error("Error in createSplitExpenseFromForm:", error)
    throw new Error(`Failed to create split expense: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Get split expenses for a user
 */
export async function getSplitExpensesForUser() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()
    
    if (!user) {
      throw new Error("Authentication required")
    }
    
    // Get expenses that are shared with the current user
    const { data, error } = await supabase
      .from('expense_splits')
      .select(`
        *,
        expense:expenses(
          id,
          amount,
          category,
          description,
          spent_at,
          user_id
        ),
        owner:expenses!inner(
          user:users(
            id,
            name,
            email
          )
        )
      `)
      .eq('shared_with', user.id)
    
    if (error) {
      throw new Error(`Error fetching split expenses: ${error.message}`)
    }
    
    return data
  } catch (error: any) {
    console.error("Error in getSplitExpensesForUser:", error)
    throw new Error(`Failed to get split expenses: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Update a split expense status
 */
export async function updateSplitExpenseStatus(
  splitId: string,
  status: 'accepted' | 'rejected'
) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()
    
    if (!user) {
      throw new Error("Authentication required")
    }
    
    // Update the split expense status
    const { data, error } = await supabase
      .from('expense_splits')
      .update({ status })
      .eq('id', splitId)
      .eq('shared_with', user.id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Error updating split expense status: ${error.message}`)
    }
    
    return data
  } catch (error: any) {
    console.error("Error in updateSplitExpenseStatus:", error)
    throw new Error(`Failed to update split expense status: ${error.message || 'Unknown error'}`)
  }
}

// This function is no longer needed since we're using a text input
// Keeping it as a stub for backward compatibility
export async function getUsersForSplitExpense() {
  return [];
}
