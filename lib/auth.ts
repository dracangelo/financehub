import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "./supabase/server"
import { getClientSupabaseClient } from "./supabase/client"

// Server-side authentication
export async function getAuthenticatedUser() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error("Error getting authenticated user:", error)
    return null
  }
}

// Client-side authentication
export function getClientAuthenticatedUser() {
  try {
    const supabase = getClientSupabaseClient()
    return supabase.auth.getUser()
  } catch (error) {
    console.error("Error getting client authenticated user:", error)
    return { data: { user: null }, error }
  }
}

// Alias for getAuthenticatedUser to maintain compatibility
export const getCurrentUser = getAuthenticatedUser

export async function requireAuth() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

