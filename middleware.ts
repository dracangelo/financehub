import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: "",
              ...options,
              maxAge: 0,
            })
          },
        },
      }
    )

    // Get the user data using the secure getUser method instead of getSession
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error("Authentication error in middleware:", error.message)
      
      // If there's an authentication error, clear the session cookies
      response.cookies.set({
        name: "sb-access-token",
        value: "",
        maxAge: 0,
      })
      response.cookies.set({
        name: "sb-refresh-token",
        value: "",
        maxAge: 0,
      })
      
      // Only redirect to login if not already on a public path
      if (!isPublicPath(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL("/login?error=session", request.url))
      }
      
      return response
    }

    // Check if user is authenticated based on user data from getUser()
    const isAuthenticated = !!data?.user

    // If the user is not signed in and the current path is not public,
    // redirect the user to /login
    if (!isAuthenticated && !isPublicPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // If the user is signed in and the current path is /login or /register,
    // redirect the user to /dashboard
    if (isAuthenticated && (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register"))) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return response
  } catch (error) {
    console.error("Error in middleware:", error)
    
    // If there's an error, don't redirect if already on a public path
    if (!isPublicPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login?error=unknown", request.url))
    }
    
    return response
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
