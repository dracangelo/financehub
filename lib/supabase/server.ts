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
  
  // Try to use next/headers if available (App Router)
  try {
    // This will throw an error if not in App Router
    const { cookies } = require('next/headers')
    
    return {
      async get(name: string) {
        const cookieStore = cookies()
        return cookieStore.get(name)?.value
      },
      async set(name: string, value: string, options?: CookieOptions) {
        try {
          const cookieStore = cookies()
          cookieStore.set(name, value, options as any)
        } catch (error) {
          console.error("Error setting cookie:", error)
        }
      },
      async remove(name: string, options?: CookieOptions) {
        try {
          const cookieStore = cookies()
          cookieStore.set(name, "", { ...options as any, maxAge: 0 })
        } catch (error) {
          console.error("Error removing cookie:", error)
        }
      }
    }
  } catch (e) {
    // next/headers not available, use a dummy implementation that will be overridden
    // when context is provided in the Pages Router
    return {
      get(name: string) { return undefined },
      set(name: string, value: string, options?: CookieOptions) {},
      remove(name: string, options?: CookieOptions) {}
    }
  }
}

// Create a Supabase client for server components/API routes
export async function createServerSupabaseClient(context?: {
  req: NextApiRequest
  res: NextApiResponse
} | GetServerSidePropsContext) {
  // Create the base cookie handler
  let cookieHandler = createCookieHandler()
  
  // If context is provided (Pages Router), override the cookie handler
  if (context) {
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
      cookies: cookieHandler
    }
  )
}

// Alias for createServerSupabaseClient to maintain compatibility
export const createClient = createServerSupabaseClient

// Export a function to get a singleton instance
let serverInstance: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null

export async function getServerSupabaseClient(context?: any) {
  if (!serverInstance) {
    try {
      serverInstance = await createServerSupabaseClient(context)
    } catch (error) {
      console.error('Error initializing Supabase server client:', error)
      throw error
    }
  }
  return serverInstance
}

