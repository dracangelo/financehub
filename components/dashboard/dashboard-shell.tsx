import type { ReactNode } from "react"

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">{children}</div>
}

