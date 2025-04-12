import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"

import { MainNavigation } from "@/components/layout/main-navigation"

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

    const navItems = [
      {
        title: "Dashboard",
        href: "/dashboard",
      },
      {
        title: "Accounts",
        href: "/accounts",
      },
      {
        title: "Transactions",
        href: "/transactions",
      },
      {
        title: "Categories",
        href: "/categories",
      },
      {
        title: "Budgets",
        href: "/budgets",
      },
      {
        title: "Investments",
        href: "/investments",
      },
      {
        title: "Tax Planner",
        href: "/tax-planner",
      },
    ]

    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
        {/* Navigation Sidebar */}
        <MainNavigation navItems={navItems} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-auto">
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in protected layout:", error)
    redirect("/login")
  }
}

