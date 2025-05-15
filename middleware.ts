import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

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
    // Create Supabase client
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession()

    // Check if we're on a public path
    const isPublic = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

    // If we're on a public path, allow access
    if (isPublic) {
      return NextResponse.next()
    }

    // If there's an error or no session, redirect to login
    if (error || !session) {
      // Clear session cookies
      const response = NextResponse.redirect(new URL('/login?error=session', request.url))
      response.cookies.set('sb-access-token', '', { maxAge: 0 })
      response.cookies.set('sb-refresh-token', '', { maxAge: 0 })
      return response
    }

    // If we have a session and we're on a public path, redirect to dashboard
    if (session && isPublic) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Allow access to protected routes
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.redirect(new URL('/login?error=server', request.url))
  }
}

// Helper function to check if a path is public
function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") || 
    pathname.startsWith("/register") || 
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") || 
    pathname.startsWith("/static") || 
    pathname === "/favicon.ico"
  )
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
