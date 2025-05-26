import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin, getCurrentUserId } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get the debt data from the request
    const requestData = await request.json()
    // Extract debtId from the request data
    const { debtId } = requestData
    
    // The client sends the debt data directly in the request body
    // Remove debtId from the request data to get the debt updates
    const { debtId: _, ...allUpdates } = requestData
    
    // Filter out fields that might not exist in the database schema
    // Only include fields we know exist in the database
    const debtUpdates = {
      name: allUpdates.name,
      type: allUpdates.type,
      current_balance: allUpdates.current_balance,
      interest_rate: allUpdates.interest_rate,
      minimum_payment: allUpdates.minimum_payment,
      loan_term: allUpdates.loan_term,
      due_date: allUpdates.due_date
    }
    
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
    console.log('Request data received:', requestData)
    console.log('Debt updates to apply:', debtUpdates)
    
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
        
        // Use the debt updates data
        console.log('Creating debt with data:', debtUpdates)
        
        // Create the debt with the provided ID - only include fields we know exist in the database
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('debts')
          .insert({
            id: debtId,
            user_id: userId,
            name: debtUpdates.name || 'Unnamed Debt',
            type: debtUpdates.type || 'personal_loan',
            current_balance: debtUpdates.current_balance || 0,
            interest_rate: debtUpdates.interest_rate || 0,
            minimum_payment: debtUpdates.minimum_payment || 0,
            loan_term: debtUpdates.loan_term || 0,
            due_date: debtUpdates.due_date,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
        
        if (insertError) {
          console.error('Error creating debt:', insertError)
          
          // If the error is a duplicate key error, the debt was already created (possibly by a concurrent request)
          // In this case, we should consider this a success and return the debt data
          if (insertError.code === '23505' && insertError.message.includes('already exists')) {
            console.log('Debt already exists, treating as success')
            
            // Try to fetch the existing debt
            const { data: existingDebt, error: fetchError } = await supabaseAdmin
              .from('debts')
              .select('*')
              .eq('id', debtId)
              .eq('user_id', userId)
              .single()
              
            if (!fetchError && existingDebt) {
              console.log('Found existing debt, returning it')
              return NextResponse.json({
                success: true,
                message: 'Debt already exists',
                debt: existingDebt
              })
            }
            
            // If we couldn't fetch the existing debt, still return success with the data we have
            return NextResponse.json({
              success: true,
              message: 'Debt already exists but could not be fetched',
              debt: {
                id: debtId,
                user_id: userId,
                ...debtUpdates,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            })
          }
          
          // For other errors, return an error response
          return NextResponse.json({
            success: false,
            message: 'Failed to create debt',
            error: insertError.message,
            details: insertError,
            debtData: {
              id: debtId,
              user_id: userId,
              ...debtUpdates
            }
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
    // Only include fields we know exist in the database
    const { data, error } = await supabaseAdmin
      .from('debts')
      .update({
        name: debtUpdates.name,
        type: debtUpdates.type,
        current_balance: debtUpdates.current_balance,
        interest_rate: debtUpdates.interest_rate,
        minimum_payment: debtUpdates.minimum_payment,
        loan_term: debtUpdates.loan_term,
        due_date: debtUpdates.due_date,
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
    
    // Return the updated debt data
    return NextResponse.json({
      success: true,
      message: 'Debt updated successfully',
      debt: data && data.length > 0 ? data[0] : {
        id: debtId,
        user_id: userId,
        ...debtUpdates,
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
