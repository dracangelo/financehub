import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options?: CookieOptions) {
          try {
            cookieStore.set(name, value, options as any)
          } catch (error) {
            console.error("Error setting cookie:", error)
          }
        },
        remove(name: string, options?: CookieOptions) {
          try {
            cookieStore.set(name, "", { ...options as any, maxAge: 0 })
          } catch (error) {
            console.error("Error removing cookie:", error)
          }
        },
      },
    }
  )
}

// Alias for createServerSupabaseClient to maintain compatibility
export const createClient = createServerSupabaseClient

// Remove the direct instantiation of supabase at the module level
// export const supabase = createServerSupabaseClient()

