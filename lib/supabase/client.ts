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

export function createClientSupabaseClient() {
  // Only create the client in browser environments
  if (typeof window === 'undefined') {
    console.warn('Attempted to create browser client in server environment')
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
      browserSupabaseClient = createBrowserClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          },
          global: {
            headers: {
              'x-application-name': 'finance-tracker'
            }
          }
        }
      )
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
