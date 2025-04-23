"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { getClientSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Github, CheckCircle } from "lucide-react"

// Define the form schema with Zod
const formSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Please enter a valid email" }),
  password: z.string().min(1, { message: "Password is required" }),
})

export type LoginFormValues = z.infer<typeof formSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = getClientSupabaseClient()

  // Check for success message from password reset
  const reset = searchParams.get("reset")
  if (reset === "success" && !success) {
    setSuccess("Your password has been successfully reset. Please log in with your new password.")
  }

  // Use react-hook-form for form handling and validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new Error("Authentication service is not available")
      }

      // Sign in with email and password
      const { error, data } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        console.error("Auth error:", error)
        
        // Provide more user-friendly error messages
        if (error.message.includes("Invalid login") || error.message.includes("credentials")) {
          setError("Invalid email or password. Please try again.")
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please verify your email before logging in.")
          // Redirect to verification page after a short delay
          setTimeout(() => {
            router.push(`/verify?email=${encodeURIComponent(values.email)}`)
          }, 3000)
        } else if (error.message.includes("rate limit")) {
          setError("Too many login attempts. Please try again later.")
        } else {
          setError(error.message)
        }
        return
      }

      // Log successful login with user metadata for debugging
      console.log("Login successful", {
        userId: data.user?.id,
        email: data.user?.email,
        lastSignIn: data.user?.last_sign_in_at,
      })

      // Redirect to dashboard with appropriate parameters
      // Check if this is the first login after email verification
      const isFirstLogin = !data.user?.last_sign_in_at || 
                          new Date(data.user.last_sign_in_at).getTime() === new Date(data.user.created_at || 0).getTime();
      
      if (isFirstLogin) {
        // First login - show welcome experience with feature highlights
        router.push("/dashboard?welcome=true&features=esg,networth,watchlist")
      } else {
        // Regular login
        router.push("/dashboard")
      }
      router.refresh()
    } catch (err) {
      console.error("Login error:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred during login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGithubSignIn}
            disabled={isLoading}
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...form.register("email")}
              error={form.formState.errors.email ? true : undefined}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              error={form.formState.errors.password ? true : undefined}
            />
            {form.formState.errors.password && (
              <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

