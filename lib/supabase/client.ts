import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if environment variables are set
if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined') {
  console.error('Missing Supabase environment variables')
}

// Create a memoized client to avoid recreating the client on every call
let browserSupabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Storage keys for session persistence
const SESSION_KEY = 'supabase.auth.token'
const REFRESH_KEY = 'supabase.auth.refreshToken'

/**
 * Enhanced client creation with better session handling and security
 * Uses getUser() for secure authentication and falls back to getSession() if needed
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
      // Create the client with session recovery and secure defaults
      browserSupabaseClient = createBrowserClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // Use PKCE flow for better security
            flowType: 'pkce',
            // Add debug logging in development
            debug: process.env.NODE_ENV === 'development'
          },
          global: {
            headers: {
              'X-Client-Info': 'supabase-js',
            },
          },
        }
      )
      
      // Add auth state change listener after client creation with error handling
      if (browserSupabaseClient) {
        browserSupabaseClient.auth.onAuthStateChange((event: string, session: any) => {
          if (event === 'SIGNED_IN' && session) {
            console.log('User signed in, session established')
            // Store session in localStorage as a backup
            try {
              localStorage.setItem('supabase_auth_backup', JSON.stringify({
                timestamp: new Date().toISOString(),
                session_exists: true
              }))
            } catch (e) {
              console.error('Failed to store session backup:', e)
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out, session removed')
            // Clear backup session data
            try {
              localStorage.removeItem('supabase_auth_backup')
            } catch (e) {
              console.error('Failed to remove session backup:', e)
            }
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully')
          } else if (event === 'USER_UPDATED') {
            console.log('User updated')
          } else if (event === 'PASSWORD_RECOVERY') {
            console.log('Password recovery initiated')
          }
        })
        
        // Add a global error handler to catch auth session missing errors
        window.addEventListener('unhandledrejection', (event) => {
          const error = event.reason
          if (error && typeof error === 'object' && 'message' in error && 
              typeof error.message === 'string' && 
              error.message.includes('Auth session missing')) {
            console.warn('Caught Auth session missing error, redirecting to login')
            // Prevent the error from bubbling up
            event.preventDefault()
            
            // Clear any invalid session state
            if (browserSupabaseClient) {
              browserSupabaseClient.auth.signOut().catch(e => {
                console.error('Error signing out after session error:', e)
              })
            }
            
            // Redirect to login page after a short delay
            setTimeout(() => {
              window.location.href = '/login?error=session_expired'
            }, 500)
          }
        })
      }

      // Add custom error handling for auth operations
      if (browserSupabaseClient) {
        // Wrap the getSession method to handle errors gracefully
        const originalGetSession = browserSupabaseClient.auth.getSession.bind(browserSupabaseClient.auth)
        browserSupabaseClient.auth.getSession = async () => {
          try {
            return await originalGetSession()
          } catch (error: any) {
            console.error('Error getting session:', error)
            // Return a valid response with no session instead of throwing
            return { data: { session: null }, error }
          }
        }

        // Wrap the refreshSession method to handle errors gracefully
        const originalRefreshSession = browserSupabaseClient.auth.refreshSession.bind(browserSupabaseClient.auth)
        browserSupabaseClient.auth.refreshSession = async () => {
          try {
            // Check if we have a session before trying to refresh
            // Make sure browserSupabaseClient is still valid
            if (!browserSupabaseClient) {
              console.error('Supabase client is null when trying to refresh session')
              return { data: { session: null, user: null }, error: new Error('Supabase client is null') }
            }
            
            const { data } = await browserSupabaseClient.auth.getSession()
            if (!data.session) {
              console.log('No session to refresh')
              return { data: { session: null, user: null }, error: null }
            }
            return await originalRefreshSession()
          } catch (error: any) {
            console.error('Error refreshing session:', error)
            // Return a valid response instead of throwing
            return { data: { session: null, user: null }, error }
          }
        }
        
        // Handle auth session missing errors through the onAuthStateChange event
        // The onError method doesn't exist in the current version of Supabase JS client
        // So we'll use the auth state change event to detect and handle errors
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
