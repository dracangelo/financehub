import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "./supabase/server"
import { getClientSupabaseClient } from "./supabase/client"
import { cache } from "react"

// Server-side authentication with caching to prevent multiple calls
export const getAuthenticatedUser = cache(async () => {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return null
    }
    
    // Use getSession instead of getUser for more reliable session handling
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Authentication error:", error.message)
      return null
    }
    
    // If we have a session, return the user
    if (data && data.session) {
      return data.session.user
    }
    
    // No session found
    return null
  } catch (error) {
    console.error("Error getting authenticated user:", error)
    return null
  }
})

// Client-side authentication
export function getClientAuthenticatedUser() {
  try {
    const supabase = getClientSupabaseClient()
    if (!supabase) {
      console.error("Failed to get Supabase client")
      return { data: { session: null }, error: new Error("Failed to get Supabase client") }
    }
    // Use getSession instead of getUser for more reliable session handling
    return supabase.auth.getSession()
  } catch (error) {
    console.error("Error getting client authenticated user:", error)
    return { data: { session: null }, error }
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
