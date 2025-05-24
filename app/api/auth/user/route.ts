import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    // Try multiple methods to get the user ID
    let userId = null
    let isAuthenticated = false
    
    // APPROACH 1: Try to get authenticated user from server-side
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.id) {
        userId = user.id
        isAuthenticated = true
        console.log(`Server: Using authenticated user ID from auth.getUser(): ${userId}`)
        return NextResponse.json({ 
          success: true, 
          userId: userId,
          isAuthenticated: true
        })
      }
    } catch (authError) {
      console.warn('Server: Error getting authenticated user with auth.getUser():', authError)
    }
    
    // APPROACH 2: Try to get authenticated user from session
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session && session.user && session.user.id) {
        userId = session.user.id
        isAuthenticated = true
        console.log(`Server: Using authenticated user ID from auth.getSession(): ${userId}`)
        return NextResponse.json({ 
          success: true, 
          userId: userId,
          isAuthenticated: true
        })
      }
    } catch (sessionError) {
      console.warn('Server: Error getting authenticated session:', sessionError)
    }
    
    // No authenticated user found, return 401 Unauthorized
    console.log('Server: No authenticated user found')
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    }, { status: 401 })
    
  } catch (error) {
    console.error('Error in /api/auth/user:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get user ID',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
