import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// List of public paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/verify',
  '/forgot-password',
  '/reset-password',
  '/debt-management' // Added debt-management to public paths
]

export async function middleware(request: NextRequest) {
  try {
    // Check if we're on a public path first
    const isPublic = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))
    
    // If we're on a public path, allow access
    if (isPublic) {
      return NextResponse.next()
    }

    // Create a response that we can modify
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Create a Supabase client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            })
          },
        },
      }
    )

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()

    // If there's no session and we're not on a public path, redirect to login
    if (!session) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If we have a session and we're on a public path, redirect to dashboard
    if (session && isPublic) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Return the response with any modified cookies
    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
