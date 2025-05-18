"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AuthRefreshContextType {
  refreshToken: () => Promise<boolean>
  isRefreshing: boolean
  lastRefreshed: Date | null
}

const AuthRefreshContext = createContext<AuthRefreshContextType>({
  refreshToken: async () => false,
  isRefreshing: false,
  lastRefreshed: null
})

export const useAuthRefresh = () => useContext(AuthRefreshContext)

export function AuthRefreshProvider({ 
  children,
  refreshInterval = 15 * 60 * 1000 // 15 minutes by default
}: { 
  children: React.ReactNode
  refreshInterval?: number
}) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const router = useRouter()

  // Function to refresh the token
  const refreshToken = async (): Promise<boolean> => {
    if (isRefreshing) return false
    
    try {
      setIsRefreshing(true)
      const response = await fetch("/api/auth/refresh", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        console.error("Failed to refresh token:", data)
        return false
      }
      
      setLastRefreshed(new Date())
      return true
    } catch (error) {
      console.error("Error refreshing token:", error)
      return false
    } finally {
      setIsRefreshing(false)
    }
  }

  // Refresh token on initial load
  useEffect(() => {
    refreshToken()
  }, [])

  // Set up periodic token refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      const success = await refreshToken()
      if (!success) {
        // If token refresh fails, notify the user but don't redirect
        // This allows them to continue using the current page until they navigate
        toast.error("Your session is expiring. Please log in again soon.", {
          duration: 10000,
          action: {
            label: "Refresh Now",
            onClick: () => refreshToken()
          }
        })
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return (
    <AuthRefreshContext.Provider value={{ refreshToken, isRefreshing, lastRefreshed }}>
      {children}
    </AuthRefreshContext.Provider>
  )
}
