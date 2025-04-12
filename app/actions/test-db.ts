"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/supabase/database.types"

// Get the current user ID from the session
async function getCurrentUserId() {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // For demo purposes, use a fixed ID if no session
  return session?.user?.id || "123e4567-e89b-12d3-a456-426614174000"
}

export async function testDatabaseConnection() {
  try {
    const userId = await getCurrentUserId()
    console.log("Testing database connection for user:", userId)
    
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Database connection failed" }
    }

    // Test if the income_sources table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('income_sources')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.error("Error checking income_sources table:", tableError)
      return { 
        success: false, 
        error: `Table check failed: ${tableError.message}`,
        details: {
          code: tableError.code,
          message: tableError.message,
          details: tableError.details,
          hint: tableError.hint
        }
      }
    }

    // Try to insert a test record
    const testId = crypto.randomUUID()
    const { data: insertData, error: insertError } = await supabase
      .from('income_sources')
      .insert({
        id: testId,
        user_id: userId,
        name: 'Test Income Source',
        type: 'other',
        amount: 100.00,
        frequency: 'monthly',
        currency: 'USD',
        is_taxable: true
      })
      .select()

    if (insertError) {
      console.error("Error inserting test record:", insertError)
      return { 
        success: false, 
        error: `Insert test failed: ${insertError.message}`,
        details: {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        }
      }
    }

    // Try to delete the test record
    const { error: deleteError } = await supabase
      .from('income_sources')
      .delete()
      .eq('id', testId)

    if (deleteError) {
      console.error("Error deleting test record:", deleteError)
      return { 
        success: false, 
        error: `Delete test failed: ${deleteError.message}`,
        details: {
          code: deleteError.code,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint
        }
      }
    }

    return { 
      success: true, 
      message: "Database connection test successful",
      tableInfo,
      insertData
    }
  } catch (error) {
    console.error("Unexpected error in testDatabaseConnection:", error)
    return { 
      success: false, 
      error: "Unexpected error during database test",
      details: error
    }
  }
} 