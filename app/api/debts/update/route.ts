import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin, getCurrentUserId } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get the debt data from the request
    const { debtId, updates } = await request.json()
    
    if (!debtId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Debt ID is required',
        message: 'Failed to update debt: Debt ID is required'
      }, { status: 400 })
    }
    
    // Create a server-side Supabase client that can access the user's session
    const supabase = await createServerSupabaseClient()
    let userId: string | null = null
    
    // Check if we have a valid Supabase client
    if (supabase) {
      try {
        // Get the authenticated user ID using the server-side client
        const { data: { user } } = await supabase.auth.getUser()
        
        // ALWAYS prioritize the authenticated user ID
        if (user?.id) {
          userId = user.id
          console.log(`Using authenticated user ID: ${userId}`)
        }
      } catch (authError) {
        console.warn('Server: Error getting authenticated user from Supabase client:', authError)
      }
    }
    
    // If no authenticated user found, fall back to client ID
    if (!userId) {
      try {
        userId = await getCurrentUserId(request)
        console.log(`No authenticated user found, using fallback ID: ${userId}`)
      } catch (error) {
        console.error('Error getting user ID:', error)
        return NextResponse.json({
          success: false,
          message: 'Authentication required',
          error: 'User not authenticated'
        }, { status: 401 })
      }
    }
    
    // If still no user ID after all attempts, return unauthorized
    if (!userId) {
      console.warn('No user ID found through any authentication method')
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      }, { status: 401 })
    }
    
    console.log(`Updating debt ${debtId} for user ${userId} using supabaseAdmin`)
    
    // Update the debt in the database using supabaseAdmin to bypass RLS policies
    // This approach is similar to how we fixed the subscription system
    const { data, error } = await supabaseAdmin
      .from('debts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', debtId)
      .eq('user_id', userId)
    
    // Log the result for debugging
    console.log('Update debt result:', data, error)
    
    if (error) {
      console.error('Error updating debt:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to update debt',
        error: typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'Unknown database error'
      }, { status: 500 })
    }
    
    // For update_debt RPC function, it returns a boolean success value, not the updated record
    // So we need to return a success response without trying to access data[0]
    return NextResponse.json({
      success: true,
      message: 'Debt updated successfully',
      // Return the updated debt data from the request instead of trying to access data[0]
      debt: {
        id: debtId,
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Unexpected error updating debt:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      message: 'Unexpected error updating debt'
    }, { status: 500 })
  }
}
