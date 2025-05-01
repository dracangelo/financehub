import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"

import { ResponsiveLayout } from "@/components/layout/responsive-layout"

export const metadata: Metadata = {
  title: {
    default: "DripCheck",
    template: "%s | DripCheck",
  },
  description: "Flaunting responsibly - A comprehensive personal finance tracking application",
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // Use a non-throwing authentication check
    const user = await getAuthenticatedUser()
    
    // Only redirect if we're certain there's no user
    if (!user) {
      // Add a query parameter to prevent redirect loops
      return redirect("/login?from=protected")
    }

    return (
      <ResponsiveLayout>
        {children}
      </ResponsiveLayout>
    )
  } catch (error) {
    console.error("Error in protected layout:", error)
    
    // Only redirect on authentication errors, not on other types of errors
    if (error instanceof Error && 
        (error.message.includes("auth") || error.message.includes("unauthorized") || 
         error.message.includes("session"))) {
      return redirect("/login?from=error")
    }
    
    // For other errors, still render the layout
    return (
      <ResponsiveLayout>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </ResponsiveLayout>
    )
  }
}
