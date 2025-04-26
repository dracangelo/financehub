import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { Database } from "./database.types"
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next"

// Universal cookie handler that works in both App Router and Pages Router
type UniversalCookieHandler = {
  get(name: string): string | undefined | Promise<string | undefined>
  set(name: string, value: string, options?: CookieOptions): void | Promise<void>
  remove(name: string, options?: CookieOptions): void | Promise<void>
}

// Create a cookie handler based on the available APIs
function createCookieHandler(): UniversalCookieHandler {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Browser environment - use document.cookie
    return {
      get(name: string) {
        const cookies = document.cookie.split(';').map(c => c.trim())
        const cookie = cookies.find(c => c.startsWith(`${name}=`))
        return cookie ? cookie.split('=')[1] : undefined
      },
      set(name: string, value: string, options?: CookieOptions) {
        let cookieString = `${name}=${value}`
        if (options) {
          if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`
          if (options.domain) cookieString += `; Domain=${options.domain}`
          if (options.path) cookieString += `; Path=${options.path}`
          if (options.secure) cookieString += `; Secure`
          if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`
        }
        document.cookie = cookieString
      },
      remove(name: string, options?: CookieOptions) {
        this.set(name, '', { ...options, maxAge: 0 })
      }
    }
  }
  
  // We're in a server environment but not in App Router
  // Return a dummy implementation that will be overridden
  // when context is provided in the Pages Router
  return {
    get(name: string) { return undefined },
    set(name: string, value: string, options?: CookieOptions) {},
    remove(name: string, options?: CookieOptions) {}
  }
}

// Create a Supabase client for server components/API routes
export function createClient(cookieStore: any) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle error
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // Handle error
          }
        },
      },
    }
  )
}

// Create a Supabase client for server components/API routes with context
export async function createServerSupabaseClient(context?: {
  req: NextApiRequest
  res: NextApiResponse
} | GetServerSidePropsContext) {
  try {
    // First try to use the App Router cookies() API if available
    // We don't import it directly to avoid breaking Pages Router
    let appRouterCookies = null;
    try {
      // Dynamic import to avoid breaking Pages Router
      if (typeof window === 'undefined') {
        const { cookies } = await import('next/headers');
        appRouterCookies = cookies();
      }
    } catch (e) {
      // Not in App Router or cookies() failed
      console.warn('App Router cookies() not available, using Pages Router approach');
    }

    // If we have cookies from App Router, use them
    if (appRouterCookies) {
      return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              const cookie = appRouterCookies.get(name);
              return cookie?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              // In App Router, cookies are read-only in Server Components
              // We can't set cookies here, but that's okay for auth
              // The client-side auth will handle setting cookies
            },
            remove(name: string, options: CookieOptions) {
              // In App Router, cookies are read-only in Server Components
              // We can't remove cookies here, but that's okay for auth
              // The client-side auth will handle removing cookies
            },
          },
        }
      );
    }
    
    // Create the base cookie handler for other environments
    let cookieHandler = createCookieHandler()
    
    // If context is provided (Pages Router), override the cookie handler
    if (context && context.req && context.res) {
      cookieHandler = {
        get(name: string) {
          return context.req.cookies[name]
        },
        set(name: string, value: string, options: CookieOptions = {}) {
          context.res.setHeader(
            "Set-Cookie",
            `${name}=${value}; ${Object.entries(options)
              .map(([key, value]) => `${key}=${value}`)
              .join("; ")}`
          )
        },
        remove(name: string, options: CookieOptions = {}) {
          context.res.setHeader(
            "Set-Cookie",
            `${name}=; Max-Age=0; ${Object.entries(options)
              .map(([key, value]) => `${key}=${value}`)
              .join("; ")}`
          )
        }
      }
    }
    
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: cookieHandler,
      }
    )
  } catch (error) {
    console.error("Error creating server Supabase client:", error)
    return null
  }
}

// Export a function to get the Supabase client
// Do not cache the instance to prevent stale authentication state
export async function getServerSupabaseClient(context?: any) {
  return createServerSupabaseClient(context)
}
