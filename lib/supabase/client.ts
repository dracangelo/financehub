import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export function createClientSupabaseClient() {
  return createBrowserClient<Database>(
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

// Create a singleton instance for client components
let clientInstance: ReturnType<typeof createClientSupabaseClient> | null = null

export function getClientSupabaseClient() {
  if (!clientInstance) {
    try {
      clientInstance = createClientSupabaseClient()
    } catch (error) {
      console.error('Error initializing Supabase client:', error)
      throw error
    }
  }
  return clientInstance
}

// For direct imports
export const supabase = getClientSupabaseClient()

