"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { type ReactNode } from "react"
import { ClientIdManager } from "@/components/client/client-id-manager"

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ClientIdManager />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
