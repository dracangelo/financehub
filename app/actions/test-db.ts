"use server"

import { createClient } from "@/lib/supabase/server"

export async function testDatabaseConnection() {
  try {
    const supabase = createClient()
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase.from('_test_connection').select('*').limit(1).maybeSingle()
    
    if (connectionError && connectionError.code !== 'PGRST116') {
      // PGRST116 means relation doesn't exist, which is expected for a non-existent test table
      return {
        success: false,
        message: "Failed to connect to database",
        error: connectionError
      }
    }
    
    // Test tables existence
    const tables = [
      'expenses',
      'assets',
      'liabilities',
      'net_worth_history',
      'watchlist',
      'investment_universe',
      'esg_categories',
      'excluded_sectors'
    ]
    
    const tableResults = {}
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count').limit(1)
      
      tableResults[table] = {
        exists: error?.code !== '42P01', // 42P01 is the error code for "relation does not exist"
        error: error ? error.message : null
      }
    }
    
    return {
      success: true,
      message: "Database connection successful",
      tables: tableResults
    }
  } catch (error) {
    console.error("Error testing database connection:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
