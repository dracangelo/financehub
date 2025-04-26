"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { getClientSupabaseClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Github, Mail, KeyRound, CheckCircle } from "lucide-react"

// Login form schema
const loginSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Please enter a valid email" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
})

// Registration form schema
const registerSchema = z.object({
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
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

export function AuthForm({ defaultTab = "login" }: { defaultTab?: "login" | "register" }) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()
  const supabase = getClientSupabaseClient()

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  })

  // Handle login form submission
  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!supabase) {
        throw new Error("Authentication service is not available. Please try again later.")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        if (error.message.includes("Invalid login") || error.message.includes("credentials")) {
          setError("Invalid email or password. Please try again.")
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please verify your email before logging in.")
          setTimeout(() => {
            router.push(`/verify?email=${encodeURIComponent(values.email)}`)
          }, 2000)
        } else {
          setError(error.message)
        }
        return
      }

      // Success - redirect to dashboard
      setSuccess("Login successful! Redirecting...")
      setIsRedirecting(true)
      
      // Store user metadata if needed
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            last_sign_in: new Date().toISOString(),
          }, { onConflict: 'id' })
          
        if (profileError) {
          console.error("Error updating profile:", profileError)
        }
      }
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1000)
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

  // Handle registration form submission
  const handleRegister = async (values: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!supabase) {
        throw new Error("Authentication service is not available. Please try again later.")
      }

      // Register with email and password
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
          },
        },
      })

      if (error) {
        console.error("Registration error:", error)
        setError(error.message)
        return
      }

      if (data.user) {
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            first_name: values.firstName,
            last_name: values.lastName,
            email: values.email,
            created_at: new Date().toISOString(),
          })
          
        if (profileError) {
          console.error("Error creating profile:", profileError)
        }
      }

      // Check if email confirmation is required
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("Registration failed. Please try again or use a different email.")
        return
      }

      if (data.user && !data.user.confirmed_at) {
        setSuccess("Registration successful! Please check your email to verify your account.")
        setIsRedirecting(true)
        
        // Reset form
        registerForm.reset()
        
        // Redirect to verification page
        setTimeout(() => {
          router.push(`/verify?email=${encodeURIComponent(values.email)}`)
        }, 2000)
      } else {
        // User is already confirmed (unlikely for new registrations)
        setSuccess("Registration successful! Redirecting to dashboard...")
        setIsRedirecting(true)
        
        setTimeout(() => {
          router.push("/dashboard")
          router.refresh()
        }, 1000)
      }
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

  // Handle OAuth sign-in (GitHub)
  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    try {
      if (!supabase) {
        throw new Error("Authentication service is not available. Please try again later.")
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error(`${provider} sign-in error:`, error)
        setError(error.message)
      }
    } catch (err) {
      console.error(`${provider} sign-in error:`, err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(`An unexpected error occurred during ${provider} sign-in`)
      }
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {activeTab === "login" ? "Welcome back" : "Create an account"}
        </CardTitle>
        <CardDescription>
          {activeTab === "login" 
            ? "Sign in to your account to continue" 
            : "Enter your information to create an account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error and success messages */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {isRedirecting && (
          <div className="flex justify-center my-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* OAuth buttons */}
        <div className="grid gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignIn('github')}
            disabled={isLoading || isRedirecting}
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading || isRedirecting}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Tabs for login and register */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          {/* Login form */}
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={isLoading || isRedirecting}
                  {...loginForm.register("email")}
                  className={loginForm.formState.errors.email ? "border-red-500" : ""}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-red-500 text-sm">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center">
                    <KeyRound className="h-4 w-4 mr-2 text-muted-foreground" />
                    Password
                  </Label>
                  <Button 
                    variant="link" 
                    className="px-0 font-normal text-xs"
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                  >
                    Forgot password?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isLoading || isRedirecting}
                  {...loginForm.register("password")}
                  className={loginForm.formState.errors.password ? "border-red-500" : ""}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 text-sm">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rememberMe" 
                  {...loginForm.register("rememberMe")} 
                  disabled={isLoading || isRedirecting}
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal">Remember me for 30 days</Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || isRedirecting}
              >
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
          </TabsContent>
          
          {/* Register form */}
          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    disabled={isLoading || isRedirecting}
                    {...registerForm.register("firstName")}
                    className={registerForm.formState.errors.firstName ? "border-red-500" : ""}
                  />
                  {registerForm.formState.errors.firstName && (
                    <p className="text-red-500 text-sm">{registerForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    disabled={isLoading || isRedirecting}
                    {...registerForm.register("lastName")}
                    className={registerForm.formState.errors.lastName ? "border-red-500" : ""}
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="text-red-500 text-sm">{registerForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registerEmail" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="registerEmail"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={isLoading || isRedirecting}
                  {...registerForm.register("email")}
                  className={registerForm.formState.errors.email ? "border-red-500" : ""}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-red-500 text-sm">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registerPassword" className="flex items-center">
                  <KeyRound className="h-4 w-4 mr-2 text-muted-foreground" />
                  Password
                </Label>
                <Input
                  id="registerPassword"
                  type="password"
                  autoComplete="new-password"
                  disabled={isLoading || isRedirecting}
                  {...registerForm.register("password")}
                  className={registerForm.formState.errors.password ? "border-red-500" : ""}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-red-500 text-sm">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  disabled={isLoading || isRedirecting}
                  {...registerForm.register("confirmPassword")}
                  className={registerForm.formState.errors.confirmPassword ? "border-red-500" : ""}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="agreeTerms" 
                  {...registerForm.register("agreeTerms")} 
                  disabled={isLoading || isRedirecting}
                />
                <Label htmlFor="agreeTerms" className="text-sm font-normal">
                  I agree to the{" "}
                  <Button variant="link" className="p-0 h-auto font-normal text-sm" type="button">
                    Terms of Service
                  </Button>
                  {" "}and{" "}
                  <Button variant="link" className="p-0 h-auto font-normal text-sm" type="button">
                    Privacy Policy
                  </Button>
                </Label>
              </div>
              {registerForm.formState.errors.agreeTerms && (
                <p className="text-red-500 text-sm">{registerForm.formState.errors.agreeTerms.message}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || isRedirecting}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
