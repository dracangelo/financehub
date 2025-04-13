import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth"

export async function POST() {
  try {
    // Test authentication
    const user = await getAuthenticatedUser()
    if (!user || !user.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Authentication failed - user not authenticated" 
      }, { status: 401 })
    }

    // Test database connection and table existence
    const supabase = await createServerSupabaseClient()
    
    // Try a direct query approach first
    try {
      // Try to query the table directly
      const { data, error: queryError } = await supabase
        .from('debts')
        .select('id', { count: 'exact' })
        .limit(0)
      
      if (queryError) {
        // Table likely doesn't exist
        return NextResponse.json({ 
          success: false,
          error: `Table access error: ${queryError.message}`,
          details: queryError
        })
      }
      
      // Table exists, try inserting a test record
      const testDebt = {
        id: crypto.randomUUID(),
        user_id: user.id,
        name: "Test Debt",
        type: "other",
        principal: 100,
        interest_rate: 5,
        minimum_payment: 10
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('debts')
        .insert(testDebt)
        .select()
      
      if (insertError) {
        return NextResponse.json({
          success: false,
          error: `Insert test failed: ${insertError.message}`,
          details: {
            insertError,
            testDebt
          }
        })
      }
      
      // Try to delete the test record
      const { error: deleteError } = await supabase
        .from('debts')
        .delete()
        .eq('id', testDebt.id)
      
      return NextResponse.json({
        success: true,
        message: "Database test successful - table exists and operations working",
        tableExists: true,
        insertSuccess: true,
        deleteSuccess: !deleteError,
        rowCount: data?.length || 0
      })
    } catch (directError) {
      return NextResponse.json({
        success: false,
        error: `Failed to verify table: ${directError instanceof Error ? directError.message : 'Unknown error'}`,
        details: directError
      })
    }
  } catch (error) {
    console.error("Error in test-debt-db API:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
