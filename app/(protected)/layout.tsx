import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"

import { ResponsiveLayout } from "@/components/layout/responsive-layout"

export const metadata: Metadata = {
  title: {
    default: "Personal Finance Tracker",
    template: "%s | Personal Finance Tracker",
  },
  description: "A comprehensive personal finance tracking application",
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      redirect("/login")
    }

    return (
      <ResponsiveLayout>
        {children}
      </ResponsiveLayout>
    )
  } catch (error) {
    console.error("Error in protected layout:", error)
    redirect("/login")
  }
}
