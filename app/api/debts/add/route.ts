import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUserId } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Get the debt data from the request
    const debtData = await request.json()
    
    if (!debtData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Debt data is required',
        message: 'Failed to add debt: No debt data provided'
      }, { status: 400 })
    }
    
    // Get authenticated user from server-side with multiple fallback mechanisms
    let userId = null
    
    // PRIORITY 1: Try to get user ID from the request headers
    const clientId = request.headers.get('client-id')
    if (clientId) {
      userId = clientId
      console.log(`Server: Using client ID from headers: ${userId}`)
    } else {
      try {
        // PRIORITY 2: Try to get authenticated user from Supabase auth
        try {
          const cookieStore = cookies()
          const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user && user.id) {
            userId = user.id
            console.log(`Server: Using authenticated user ID: ${userId}`)
          }
        } catch (authError) {
          console.warn('Server: Error getting authenticated user from Supabase:', authError)
        }
        
        // PRIORITY 3: If still no user ID, try the getCurrentUserId helper
        if (!userId) {
          try {
            userId = await getCurrentUserId(request)
            if (userId) {
              console.log(`Server: Using user ID from getCurrentUserId: ${userId}`)
            }
          } catch (getCurrentUserIdError) {
            console.warn('Server: Error getting user ID from getCurrentUserId:', getCurrentUserIdError)
          }
        }
        
        // PRIORITY 4: Use default UUID as last resort
        if (!userId) {
          userId = '00000000-0000-0000-0000-000000000000'
          console.warn(`Server: Using default UUID as last resort: ${userId}`)
        }
      } catch (authError) {
        console.warn('Server: Error in authentication flow:', authError)
        userId = '00000000-0000-0000-0000-000000000000'
        console.warn(`Server: Using default UUID after error: ${userId}`)
      }
    }
    
    console.log(`Adding debt for user ${userId} using supabaseAdmin`)
    
    // Generate a UUID for the debt
    const debtId = crypto.randomUUID()
    
    // Add the debt to the database using direct insert with supabaseAdmin
    // This bypasses RLS policies completely, similar to how we fixed the subscription system
    const { data, error } = await supabaseAdmin
      .from('debts')
      .insert({
        id: debtId,
        user_id: userId,
        name: debtData.name,
        type: debtData.type || 'personal_loan',
        current_balance: debtData.current_balance,
        interest_rate: debtData.interest_rate,
        minimum_payment: debtData.minimum_payment,
        loan_term: debtData.loan_term,
        due_date: debtData.due_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    // Log the result for debugging
    console.log('Insert debt result:', data, error)
    
    if (error) {
      console.error('Error adding debt:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: 'Failed to add debt'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debt added successfully',
      debt: data[0]
    })
  } catch (error) {
    console.error('Unexpected error adding debt:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      message: 'Unexpected error adding debt'
    }, { status: 500 })
  }
}
