"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/server"
import { v4 as uuidv4 } from "uuid"

/**
 * Upload a receipt image to Supabase storage
 */
export async function uploadReceipt(file: File, expenseId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()
    
    if (!user) {
      throw new Error("Authentication required")
    }
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${user.id}/${expenseId}/${fileName}`
    
    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      throw new Error(`Error uploading receipt: ${error.message}`)
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath)
    
    // Create a record in the receipts table
    const { error: insertError } = await supabase
      .from('receipts')
      .insert({
        expense_id: expenseId,
        user_id: user.id,
        file_path: filePath,
        file_name: fileName,
        url: publicUrl,
        content_type: file.type
      })
    
    if (insertError) {
      throw new Error(`Error creating receipt record: ${insertError.message}`)
    }
    
    return {
      filePath,
      publicUrl
    }
  } catch (error: any) {
    console.error("Error in uploadReceipt:", error)
    throw new Error(`Failed to upload receipt: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Get receipts for an expense
 */
export async function getReceiptsForExpense(expenseId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()
    
    if (!user) {
      throw new Error("Authentication required")
    }
    
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('expense_id', expenseId)
      .eq('user_id', user.id)
    
    if (error) {
      throw new Error(`Error fetching receipts: ${error.message}`)
    }
    
    return data
  } catch (error: any) {
    console.error("Error in getReceiptsForExpense:", error)
    throw new Error(`Failed to get receipts: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Delete a receipt
 */
export async function deleteReceipt(receiptId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()
    
    if (!user) {
      throw new Error("Authentication required")
    }
    
    // Get the receipt to find the file path
    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .eq('user_id', user.id)
      .single()
    
    if (fetchError) {
      throw new Error(`Error fetching receipt: ${fetchError.message}`)
    }
    
    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('receipts')
      .remove([receipt.file_path])
    
    if (storageError) {
      console.error(`Error deleting receipt file: ${storageError.message}`)
    }
    
    // Delete the record from the database
    const { error: deleteError } = await supabase
      .from('receipts')
      .delete()
      .eq('id', receiptId)
      .eq('user_id', user.id)
    
    if (deleteError) {
      throw new Error(`Error deleting receipt record: ${deleteError.message}`)
    }
    
    return true
  } catch (error: any) {
    console.error("Error in deleteReceipt:", error)
    throw new Error(`Failed to delete receipt: ${error.message || 'Unknown error'}`)
  }
}
