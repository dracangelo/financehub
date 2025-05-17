import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Execute the SQL function to create the reports bucket with proper RLS policies
    const { data, error } = await supabase.rpc('create_reports_bucket')
    
    if (error) {
      console.error('Error setting up reports bucket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'Reports bucket setup completed successfully' })
  } catch (error: any) {
    console.error('Error in storage setup endpoint:', error)
    return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 })
  }
}
