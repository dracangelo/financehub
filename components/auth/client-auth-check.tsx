'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClientSupabaseClient } from '@/lib/supabase/client'
import Cookies from 'js-cookie'
import { v4 as uuidv4 } from 'uuid'

interface ClientAuthCheckProps {
  children: React.ReactNode
  fallbackUrl: string
}

export default function ClientAuthCheck({ children, fallbackUrl }: ClientAuthCheckProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  useEffect(() => {
    async function checkAuth() {
      try {
        // Get Supabase client
        const supabase = getClientSupabaseClient()
        if (!supabase) {
          console.error('Failed to get Supabase client')
          setIsAuthenticated(false)
          return
        }
        
        // Check if user is authenticated
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Authentication error:', error.message)
          
          // If token is expired, try to refresh it
          if (error.message.includes('token is expired') || 
              error.message.includes('invalid JWT') ||
              error.message.includes('token has invalid claims')) {
            
            try {
              // Try to refresh the session
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
              
              if (refreshError || !refreshData.session) {
                console.error('Failed to refresh session:', refreshError?.message)
                setIsAuthenticated(false)
                return
              }
              
              // Session refreshed successfully
              console.log('Session refreshed successfully')
              setIsAuthenticated(true)
              return
            } catch (refreshError) {
              console.error('Error refreshing session:', refreshError)
              setIsAuthenticated(false)
              return
            }
          }
          
          setIsAuthenticated(false)
          return
        }
        
        // Check if we have a valid session
        if (!data.session) {
          // No session, but let's check for client ID
          const clientId = Cookies.get('client-id')
          
          if (!clientId) {
            // Generate a new client ID and set it in a cookie
            const newClientId = uuidv4()
            Cookies.set('client-id', newClientId, { expires: 365 }) // 1 year expiration
            
            // Also set it as a header for API requests
            const userIdHeader = document.createElement('meta')
            userIdHeader.httpEquiv = 'x-user-id'
            userIdHeader.content = newClientId
            document.head.appendChild(userIdHeader)
          }
          
          setIsAuthenticated(false)
          return
        }
        
        // We have a valid session
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error checking authentication:', error)
        setIsAuthenticated(false)
      }
    }
    
    checkAuth()
  }, [])
  
  // Handle different authentication states
  useEffect(() => {
    if (isAuthenticated === false) {
      // Redirect to login page after a short delay
      // This gives the browser time to set cookies
      const redirectTimer = setTimeout(() => {
        router.replace(fallbackUrl)
      }, 100)
      
      return () => clearTimeout(redirectTimer)
    }
  }, [isAuthenticated, router, fallbackUrl])
  
  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // If authenticated, render children
  if (isAuthenticated === true) {
    return <>{children}</>
  }
  
  // If not authenticated, render nothing (will redirect)
  return null
}
