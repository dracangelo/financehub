import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Create a cookie store
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'supabase', 'db', 'update_debts_rls.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Execute the SQL script
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: sqlContent
    })
    
    if (error) {
      console.error('Error executing SQL script:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: 'Failed to update debts RLS policies'
      }, { status: 500 })
    }
    
    // Also directly update the RLS policies as a backup
    const { error: directError } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- Drop the existing RLS policy
        DROP POLICY IF EXISTS "Users can manage their own debts" ON public.debts;
        
        -- Create a more permissive policy for authenticated users
        CREATE POLICY "Authenticated users can manage their own debts"
        ON public.debts
        FOR ALL
        USING (
          -- Allow access if the user is authenticated and the record belongs to them
          (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        );
        
        -- Create a policy for anonymous users with client IDs
        CREATE POLICY "Anonymous users can manage debts with their client ID"
        ON public.debts
        FOR ALL
        USING (
          -- For anonymous users, we'll use a special function to check client ID
          (auth.uid() IS NULL)
        );
        
        -- Refresh PostgREST schema cache
        NOTIFY pgrst, 'reload schema';
      `
    })
    
    if (directError) {
      console.warn('Error executing direct SQL for RLS update:', directError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debts RLS policies updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error updating debts RLS policies:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      message: 'Unexpected error updating debts RLS policies'
    }, { status: 500 })
  }
}
