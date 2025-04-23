import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(new URL("/login?error=auth", request.url))
    }
    
    // If we have a user, ensure their profile exists
    if (data?.user) {
      try {
        // First check if profile already exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle()
        
        // If profile doesn't exist, create it
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              first_name: data.user.user_metadata.first_name || "User",
              last_name: data.user.user_metadata.last_name || "",
              email: data.user.email || "",
            })
          
          if (profileError) {
            console.error("Error creating profile:", profileError)
            // Continue anyway - the user is authenticated
          } else {
            console.log("Profile created successfully for user:", data.user.id)
          }
        }
      } catch (err) {
        console.error("Exception during profile creation:", err)
        // Continue anyway - the user is authenticated
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", request.url))
}

