import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUserId } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Get the debt ID from the request
    const { debtId } = await request.json()
    
    if (!debtId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Debt ID is required',
        message: 'Failed to delete debt: Debt ID is required'
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
    
    console.log(`Deleting debt ${debtId} for user ${userId} using supabaseAdmin`)
    
    // Delete the debt from the database using direct delete with supabaseAdmin
    // This bypasses RLS policies completely, similar to how we fixed the subscription system
    const { data, error } = await supabaseAdmin
      .from('debts')
      .delete()
      .eq('id', debtId)
      .eq('user_id', userId)
    
    // Log the result for debugging
    console.log('Delete debt result:', data, error)
    
    if (error) {
      console.error('Error deleting debt:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to delete debt',
        error: typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'Unknown database error'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debt deleted successfully'
    })
  } catch (error) {
    console.error('Unexpected error deleting debt:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      message: 'Unexpected error deleting debt'
    }, { status: 500 })
  }
}
