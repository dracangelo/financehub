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
    
    let userId: string | null = null
    
    // Get authenticated user ID from server-side Supabase
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        error: 'Could not initialize Supabase client'
      }, { status: 401 })
    }
    
    try {
      // Get the authenticated user ID using the server-side client
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !user.id) {
        return NextResponse.json({
          success: false,
          message: 'Authentication required',
          error: 'User not authenticated'
        }, { status: 401 })
      }
      
      userId = user.id
      console.log(`Using authenticated user ID: ${userId}`)
    } catch (authError) {
      console.error('Error getting authenticated user:', authError)
      return NextResponse.json({
        success: false,
        message: 'Authentication error',
        error: authError instanceof Error ? authError.message : 'Unknown authentication error'
      }, { status: 401 })
    }
    
    console.log(`Updating debt ${debtId} for user ${userId} using supabaseAdmin`)
    console.log('Updates to apply:', updates)
    
    // First check if the debt exists for this user
    const { data: existingDebt, error: checkError } = await supabaseAdmin
      .from('debts')
      .select('*')
      .eq('id', debtId)
      .eq('user_id', userId)
      .single()
    
    if (checkError) {
      console.error('Error checking if debt exists:', checkError)
      // If the debt doesn't exist, we'll create it
      if (checkError.code === 'PGRST116') { // No rows returned
        console.log(`Debt ${debtId} not found for user ${userId}, creating it instead`)
        
        // Create the debt with the provided ID
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('debts')
          .insert({
            id: debtId,
            user_id: userId,
            name: updates.name || 'Unnamed Debt',
            type: updates.type || 'personal_loan',
            current_balance: updates.current_balance || 0,
            principal: updates.principal || updates.current_balance || 0,
            interest_rate: updates.interest_rate || 0,
            minimum_payment: updates.minimum_payment || 0,
            loan_term: updates.loan_term || 0,
            due_date: updates.due_date,
            payment_frequency: updates.payment_frequency || 'monthly',
            status: updates.status || 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
        
        if (insertError) {
          console.error('Error creating debt:', insertError)
          return NextResponse.json({
            success: false,
            message: 'Failed to create debt',
            error: insertError.message
          }, { status: 500 })
        }
        
        console.log('Created debt successfully:', insertData)
        return NextResponse.json({
          success: true,
          message: 'Debt created successfully',
          debt: insertData[0]
        })
      }
      
      return NextResponse.json({
        success: false,
        message: 'Failed to check if debt exists',
        error: checkError.message
      }, { status: 500 })
    }
    
    console.log('Existing debt found:', existingDebt)
    
    // Update the debt in the database using supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('debts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', debtId)
      .eq('user_id', userId)
      .select() // Add select() to return the updated record
    
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
