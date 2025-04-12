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
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const supabase = getClientSupabaseClient()

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

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: "signup",
      })

      if (error) {
        setError(error.message)
        return
      }

      // Show success message before redirecting
      setSuccess(true)

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResendLoading(true)
    setError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) {
        setError(error.message)
        return
      }

      setResendSuccess(true)
    } catch (err) {
      setError("Failed to resend verification code")
      console.error(err)
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
        <CardContent className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification code to {email}. Please enter it below to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {resendSuccess && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>A new verification code has been sent to your email.</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="Enter your verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              className="text-center text-lg tracking-wider"
              maxLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
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
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm">
          Didn&apos;t receive a code?{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={handleResendCode}
            disabled={resendLoading}
          >
            {resendLoading ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Resending...
              </>
            ) : (
              "Resend code"
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

