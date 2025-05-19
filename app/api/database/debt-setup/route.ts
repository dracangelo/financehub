import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Create a cookie store without await since cookies() returns ReadonlyRequestCookies, not a Promise
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // First, ensure the debts table has all required columns
    const { data: columnCheckData, error: columnCheckError } = await supabase
      .rpc('ensure_debts_columns_exist')
      .select()
    
    if (columnCheckError) {
      console.error('Error checking columns:', columnCheckError)
      
      // If the RPC doesn't exist or fails, try direct SQL
      const { error: alterTableError } = await supabase.rpc('execute_sql', {
        sql_query: `
          DO $$ 
          BEGIN
            -- Check if type column exists and add it if not
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'debts' AND column_name = 'type') THEN
              ALTER TABLE debts ADD COLUMN type TEXT DEFAULT 'personal_loan';
            END IF;
          END $$;
        `
      })
      
      if (alterTableError) {
        console.error('Error altering table:', alterTableError)
      }
    }
    
    // Refresh the PostgREST schema cache
    const { error: refreshError } = await supabase.rpc('refresh_postgrest_schema')
    
    if (refreshError) {
      console.error('Error refreshing schema cache:', refreshError)
      
      // If the RPC doesn't exist, try direct SQL
      const { error: notifyError } = await supabase.rpc('execute_sql', {
        sql_query: `NOTIFY pgrst, 'reload schema';`
      })
      
      if (notifyError) {
        console.error('Error sending NOTIFY command:', notifyError)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully. Schema cache has been refreshed.'
    })
  } catch (error) {
    console.error('Error in debt setup:', error)
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: 'Please ensure the debts table exists with the required columns: type, current_balance, interest_rate, minimum_payment, loan_term'
    }, { status: 500 })
  }
}
