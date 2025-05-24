import { NextRequest, NextResponse } from 'next/server'
import { DebtService } from '@/lib/debt/debt-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin, getCurrentUserId } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
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
          debts: []
        }, { status: 401 })
      }
    }
    
    // If still no user ID after all attempts, return unauthorized
    if (!userId) {
      console.warn('No user ID found through any authentication method')
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        debts: []
      }, { status: 401 })
    }
    
    console.log(`Fetching debts for user ${userId} using supabaseAdmin`)
    
    // Fetch debts for this user using direct query with supabaseAdmin
    // This bypasses RLS policies completely, similar to how we fixed the subscription system
    const { data: debts, error: supabaseError } = await supabaseAdmin
      .from('debts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    // Log the result for debugging
    console.log(`Fetched debts using SQL function:`, debts?.length || 0, 'debts found')
    
    // Check for errors first
    if (supabaseError) {
      console.error('Error fetching debts:', supabaseError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch debts',
        error: typeof supabaseError === 'object' && supabaseError !== null && 'message' in supabaseError 
          ? String(supabaseError.message) 
          : 'Unknown database error'
      }, { status: 500 })
    }
    
    // If no debts are found, return an empty array
    if (!debts || debts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No debts found',
        debts: []
      })
    }
    
    console.log('Successfully fetched debts via API:', { success: true, message: 'Debts fetched successfully', debts: debts })
    
    return NextResponse.json({
      success: true,
      message: 'Debts fetched successfully',
      debts: debts
    })
  } catch (error) {
    console.error('Unexpected error fetching debts:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      message: 'Unexpected error fetching debts'
    }, { status: 500 })
  }
}
