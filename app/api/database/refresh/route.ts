import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log("Starting schema refresh...");
    
    // Create a Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing Supabase credentials" 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First, let's load and execute our fix_watchlist_issues function
    console.log("Loading and executing fix_watchlist_issues function...");
    
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const fixIssuesSqlPath = path.join(process.cwd(), 'app', 'api', 'database', 'fix_watchlist_issues.sql');
    const fixIssuesSql = fs.readFileSync(fixIssuesSqlPath, 'utf8');
    
    // Create the function
    const { error: createFunctionError } = await supabase.rpc('exec_sql', { sql: fixIssuesSql });
    
    if (createFunctionError) {
      console.error("Error creating fix_watchlist_issues function:", createFunctionError);
    } else {
      console.log("Successfully created fix_watchlist_issues function");
      
      // Execute the function
      const { error: execFunctionError } = await supabase.rpc('exec_sql', { 
        sql: 'SELECT fix_watchlist_issues();' 
      });
      
      if (execFunctionError) {
        console.error("Error executing fix_watchlist_issues function:", execFunctionError);
      } else {
        console.log("Successfully executed fix_watchlist_issues function");
      }
    }
    
    // Also directly add all required columns using raw SQL as a backup
    console.log("Directly adding all required columns as backup...");
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add all required columns if they don't exist
        ALTER TABLE IF EXISTS public.watchlist ADD COLUMN IF NOT EXISTS alert_threshold NUMERIC;
        ALTER TABLE IF EXISTS public.watchlist ADD COLUMN IF NOT EXISTS price NUMERIC;
        ALTER TABLE IF EXISTS public.watchlist ADD COLUMN IF NOT EXISTS target_price NUMERIC;
        ALTER TABLE IF EXISTS public.watchlist ADD COLUMN IF NOT EXISTS notes TEXT;
        ALTER TABLE IF EXISTS public.watchlist ADD COLUMN IF NOT EXISTS sector TEXT;
        ALTER TABLE IF EXISTS public.watchlist ADD COLUMN IF NOT EXISTS price_alert_enabled BOOLEAN DEFAULT FALSE;
      `
    });
    
    if (sqlError) {
      console.warn("Error executing direct SQL:", sqlError);
      // Continue anyway, we'll try the function approach
    } else {
      console.log("Direct SQL execution successful");
    }
    
    // Now call the refresh schema function
    console.log("Calling refresh_postgrest_schema function...");
    const { error } = await supabase.rpc('refresh_postgrest_schema');
    
    if (error) {
      console.error("Error refreshing schema:", error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    console.log("Schema refresh completed successfully");
    
    // Wait a moment to let the schema cache refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json({ 
      success: true, 
      message: "Schema refreshed successfully" 
    });
    
  } catch (error) {
    console.error("Unexpected error during schema refresh:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
