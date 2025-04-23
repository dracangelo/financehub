"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { getClientSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const supabase = getClientSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Basic validation
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    try {
      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new Error("Authentication service is not available")
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        console.error("Password reset error:", error)
        
        // Provide more user-friendly error messages
        if (error.message.includes("rate limit")) {
          setError("Too many password reset attempts. Please try again later.")
        } else if (error.message.includes("not found")) {
          // Don't reveal if email exists or not for security reasons
          // Just show the success message anyway
          console.log("Email not found, but showing success message for security")
          setIsSubmitted(true)
          return
        } else {
          setError(error.message)
        }
        return
      }

      // Log successful password reset request
      console.log("Password reset email sent successfully", {
        email,
        timestamp: new Date().toISOString(),
      })

      setIsSubmitted(true)
    } catch (err) {
      console.error("Unexpected error during password reset:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred. Please try again later.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>We&apos;ve sent a password reset link to {email}. Please check your inbox.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-4 text-sm text-muted-foreground">
            <p>If you don&apos;t see the email in your inbox, please check your spam folder.</p>
            <p className="mt-2">The link will expire in 24 hours for security reasons.</p>
          </div>
          <div className="mt-6 text-sm">
            <p>After resetting your password, you&apos;ll have access to all FinanceHub features including:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-left">
              <li>ESG investment screening</li>
              <li>Net worth tracking</li>
              <li>Investment watchlist</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot password</CardTitle>
        <CardDescription>Enter your email address and we&apos;ll send you a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

