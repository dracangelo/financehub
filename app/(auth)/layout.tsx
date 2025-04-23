import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const user = await getAuthenticatedUser()

    if (user) {
      redirect("/dashboard")
    }

    return (
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl">FinanceHub</span>
            <span className="text-xs text-muted-foreground">Personal Finance Management</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">{children}</div>
        </main>
        <footer className="py-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FinanceHub. All rights reserved.</p>
        </footer>
      </div>
    )
  } catch (error) {
    console.error("Error in auth layout:", error)
    // Continue to show the auth page even if there's an error
    return (
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl">FinanceHub</span>
            <span className="text-xs text-muted-foreground">Personal Finance Management</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">{children}</div>
        </main>
        <footer className="py-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FinanceHub. All rights reserved.</p>
        </footer>
      </div>
    )
  }
}
