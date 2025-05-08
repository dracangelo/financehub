import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

// Create a memoized client to avoid recreating the client on every call
let browserSupabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Storage keys for session persistence
const SESSION_KEY = 'supabase.auth.token'
const REFRESH_KEY = 'supabase.auth.refreshToken'

/**
 * Enhanced client creation with better session handling
 * This resolves issues with 'Auth session missing' errors
 */
export function createClientSupabaseClient() {
  // Only create the client in browser environments
  if (typeof window === 'undefined') {
    // Don't warn about server-side creation, just return null
    return null
  }
  
  // Double check environment variables before creating client
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Cannot create Supabase client: Missing environment variables')
    return null
  }
  
  try {
    // Create a new client if one doesn't exist
    if (!browserSupabaseClient) {
      // Create the client with session recovery
      browserSupabaseClient = createBrowserClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            storage: localStorage,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
          global: {
            headers: {
              'X-Client-Info': 'supabase-js',
            },
          },
        }
      )

      // Subscribe to auth state changes
      if (browserSupabaseClient) {
        browserSupabaseClient.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            console.log('User signed in, session established')
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out, session removed')
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully')
          }
        })
      }
    }
    
    return browserSupabaseClient
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    return null
  }
}

// Get client Supabase instance
export function getClientSupabaseClient() {
  return createClientSupabaseClient()
}

// For direct imports - but only in browser environments
export const supabase = typeof window !== 'undefined' ? getClientSupabaseClient() : null
