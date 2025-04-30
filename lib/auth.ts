import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "./supabase/server"
import { getClientSupabaseClient } from "./supabase/client"
import { ensureUserExists } from "./services/user-service"
import { cache } from "react"

// Server-side authentication with caching to prevent multiple calls
export const getAuthenticatedUser = cache(async () => {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return null
    }
    
    // Use getUser for secure authentication by contacting the Supabase Auth server
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      // Don't throw an error for auth session missing - this is expected for unauthenticated users
      if (error.message.includes("Auth session missing")) {
        return null
      }
      console.error("Authentication error:", error.message)
      return null
    }
    
    // If we have a user, ensure they exist in the public.users table
    if (data && data.user && data.user.email) {
      // Check if user exists in the public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()
      
      if (userError) {
        console.error("Error checking if user exists:", userError.message)
      } else if (!userData) {
        // If user doesn't exist in the public.users table, create a new record
        // Generate a username based on email
        const emailPrefix = data.user.email.split('@')[0]
        const username = `${emailPrefix}${Math.floor(Math.random() * 1000)}`
        
        // Create a new user record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username,
            email: data.user.email,
            is_email_verified: data.user.email_confirmed_at ? true : false,
            mfa_enabled: false,
            is_biometrics_enabled: false,
            suspicious_login_flag: false,
            session_timeout_minutes: 30,
            emergency_access_enabled: false,
            has_consented: false,
            privacy_level: 'standard',
            local_data_only: false,
            allow_data_analysis: true,
            data_retention_policy: '1y',
            locale: 'en-US',
            currency_code: 'USD',
            timezone: 'UTC',
            theme: 'system',
            date_format: 'YYYY-MM-DD',
            notification_preferences: {},
            onboarding_completed: false,
            user_role: 'user',
            permission_scope: {},
            marketing_opt_in: false,
            last_login_at: new Date().toISOString(),
            last_active_at: new Date().toISOString()
          })
        
        if (insertError) {
          console.error("Error creating user record:", insertError.message)
        }
      }
      
      return data.user
    }
    
    // No session found
    return null
  } catch (error) {
    console.error("Error getting authenticated user:", error)
    return null
  }
})

// Client-side authentication
export async function getClientAuthenticatedUser() {
  try {
    const supabase = getClientSupabaseClient()
    if (!supabase) {
      console.error("Failed to get Supabase client")
      return { data: { user: null }, error: new Error("Failed to get Supabase client") }
    }
    
    // Use getUser for secure authentication by contacting the Supabase Auth server
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error("Authentication error:", error.message)
      return { data: { user: null }, error }
    }
    
    // If we have a user, ensure they exist in the public.users table
    if (data && data.user && data.user.email) {
      await ensureUserExists(data.user.id, data.user.email)
    }
    
    return { data, error }
  } catch (error) {
    console.error("Error getting client authenticated user:", error)
    return { data: { user: null }, error }
  }
}

// Alias for getAuthenticatedUser to maintain compatibility
export const getCurrentUser = getAuthenticatedUser

export async function requireAuth() {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      // Add a query parameter to help track redirect sources
      redirect("/login?from=require_auth")
    }

    return user
  } catch (error) {
    console.error("Error in requireAuth:", error)
    redirect("/login?from=error")
  }
}
