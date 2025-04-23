"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Separator } from "@/components/ui/separator"
import { Loader2, Github } from "lucide-react"

// Define the form schema with Zod
const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export type RegisterFormValues = z.infer<typeof formSchema>

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()
  const supabase = getClientSupabaseClient()

  // Use react-hook-form for form handling and validation
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const handleSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new Error("Authentication service is not available")
      }

      // TEMPORARY WORKAROUND: Use magic link authentication instead of password-based registration
      // This bypasses the database error during user creation
      const { data: magicLinkData, error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (magicLinkError) {
        console.error("Magic link error:", magicLinkError);
        setError(magicLinkError.message);
        return;
      }

      // If we get here, the magic link was sent successfully
      setSuccess("We've sent you a magic link to your email. Please check your inbox and click the link to complete your registration.");
      setIsRedirecting(true);
      
      // Reset form and loading state
      form.reset();
      setTimeout(() => {
        router.push(`/verify?email=${encodeURIComponent(values.email)}`);
      }, 3000);
      return;


      // Check if email confirmation is required
    } catch (err) {
      console.error("Registration error:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred during registration")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    try {
      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new Error("Authentication service is not available")
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("GitHub sign-in error:", error)
        setError(error.message)
      }
    } catch (err) {
      console.error("GitHub sign-in error:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred during GitHub sign-in")
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your information below to create your account</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {isRedirecting && (
          <div className="flex justify-center mb-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGithubSignIn}
            disabled={isLoading || isRedirecting}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                error={form.formState.errors.firstName ? true : undefined}
              />
              {form.formState.errors.firstName && (
                <p className="text-red-500 text-sm">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                error={form.formState.errors.lastName ? true : undefined}
              />
              {form.formState.errors.lastName && (
                <p className="text-red-500 text-sm">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

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
            <Label htmlFor="password">Password</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
              error={form.formState.errors.confirmPassword ? true : undefined}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || isRedirecting}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

