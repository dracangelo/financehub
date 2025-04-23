"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getClientSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle } from "lucide-react"

export default function VerifyPage() {
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendCount, setResendCount] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const supabase = getClientSupabaseClient()
  
  // Track countdown for resend cooldown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Auto-focus on the verification code input
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById("verificationCode")
      if (input) {
        input.focus()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Basic validation
    if (!verificationCode || verificationCode.length < 6) {
      setError("Please enter a valid verification code")
      setIsLoading(false)
      return
    }

    try {
      const { error, data } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: "signup",
      })

      if (error) {
        // Handle specific error cases with more user-friendly messages
        if (error.message.includes("Invalid OTP") || error.message.includes("expired")) {
          setError("Invalid or expired verification code. Please try again or request a new code.")
        } else {
          setError(error.message)
        }
        return
      }

      // Show success message before redirecting
      setSuccess(true)

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        // Redirect to the dashboard with a welcome flag to show onboarding information
        // about the ESG investment features and net worth tracking
        router.push("/dashboard?welcome=true&features=esg,networth,watchlist")
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error("Verification error:", err)
      setError("An unexpected error occurred during verification")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    // Prevent abuse of resend functionality
    if (countdown > 0) {
      return
    }

    setResendLoading(true)
    setError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes("rate limit")) {
          setError("Too many attempts. Please wait before requesting another code.")
        } else if (error.message.includes("already confirmed")) {
          setError("This email is already verified. Please try logging in.")
          // Redirect to login after a delay
          setTimeout(() => {
            router.push("/login")
          }, 3000)
        } else {
          setError(error.message)
        }
        return
      }

      // Update resend count and set cooldown
      const newResendCount = resendCount + 1
      setResendCount(newResendCount)
      
      // Increase cooldown period with each resend to prevent abuse
      // First resend: 30s, Second: 60s, Third+: 120s
      const cooldownPeriod = newResendCount === 1 ? 30 : newResendCount === 2 ? 60 : 120
      setCountdown(cooldownPeriod)
      
      setResendSuccess(true)
    } catch (err) {
      console.error("Resend error:", err)
      setError("Failed to resend verification code")
    } finally {
      setResendLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Email verified!</CardTitle>
          <CardDescription>Your email has been successfully verified. Redirecting to dashboard...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <p className="text-sm text-muted-foreground text-center">
            You'll have access to all FinanceHub features including ESG investment screening, 
            net worth tracking, and watchlist functionality.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Verify your email</CardTitle>
        <CardDescription>
          We sent a verification code to <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {error && (
              <div className="rounded bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {resendSuccess && (
              <div className="rounded bg-green-500/15 p-3 text-sm text-green-600">
                Verification code resent successfully! Please check your email.
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !verificationCode || verificationCode.length < 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Didn&apos;t receive a code?{" "}
              {countdown > 0 ? (
                <span className="text-muted-foreground">
                  Resend available in <span className="font-medium">{countdown}s</span>
                </span>
              ) : (
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={handleResendCode}
                  disabled={resendLoading || countdown > 0}
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    "Resend code"
                  )}
                </Button>
              )}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              After verification, you'll have access to all FinanceHub features including
              ESG investment screening, net worth tracking, and watchlist functionality.
            </p>
          </div>
      </CardContent>
    </Card>
  )
}
