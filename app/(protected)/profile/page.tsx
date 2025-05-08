"use client"

import { WidgetLayout } from "@/components/dashboard/widget-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { User } from "@supabase/supabase-js"
import { Spinner } from "@/components/ui/spinner"

interface ProfileData {
  id: string
  username?: string
  full_name?: string
  email?: string
  avatar_url?: string
  phone?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        console.log('Fetching user and profile data...')
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Auth user retrieved:', user ? 'User found' : 'No user')
        setUser(user)

        if (user) {
          // Fetch profile data
          console.log('Fetching profile data from API...')
          const response = await fetch("/api/profile")
          console.log('Profile API response status:', response.status)
          
          if (response.ok) {
            const profileData = await response.json()
            console.log('Profile data retrieved:', profileData)
            setProfile(profileData)
            
            // Split full name into first and last name
            if (profileData.full_name) {
              const nameParts = profileData.full_name.split(" ")
              setFirstName(nameParts[0] || "")
              setLastName(nameParts.slice(1).join(" ") || "")
              console.log('Name parsed:', { firstName: nameParts[0], lastName: nameParts.slice(1).join(" ") })
            }
            
            setPhone(profileData.phone || "")
          } else {
            console.error('Failed to fetch profile data, status:', response.status)
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            console.error('Error details:', errorData)
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndProfile()
  }, [supabase, toast])

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      // Log the data being sent to help with debugging
      console.log('Saving profile with data:', {
        first_name: firstName,
        last_name: lastName,
        phone
      })
      
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone
        })
      })

      // Log the response status to help with debugging
      console.log('Profile update response status:', response.status)
      
      if (response.ok) {
        const updatedProfile = await response.json()
        console.log('Updated profile data:', updatedProfile)
        
        // Update the profile state with the new data
        setProfile(updatedProfile)
        
        // Update the form fields to reflect the changes
        if (updatedProfile.full_name) {
          const nameParts = updatedProfile.full_name.split(" ")
          setFirstName(nameParts[0] || "")
          setLastName(nameParts.slice(1).join(" ") || "")
        }
        setPhone(updatedProfile.phone || "")
        
        toast({
          title: "Success",
          description: "Profile updated successfully"
        })
      } else {
        const errorData = await response.json()
        console.error('Error response from API:', errorData)
        throw new Error(errorData.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed")
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        throw new Error("File too large. Maximum size is 2MB")
      }

      // Convert file to base64
      const base64 = await convertFileToBase64(file)
      
      console.log('Uploading profile picture...')
      
      // Update profile with base64 image
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          avatar_base64: base64
        })
      })

      console.log('Profile picture upload response status:', response.status)
      
      if (response.ok) {
        const updatedProfile = await response.json()
        console.log('Updated profile with new picture:', updatedProfile)
        
        // Update the profile state with the new data
        setProfile(updatedProfile)
        
        toast({
          title: "Success",
          description: "Profile picture updated successfully"
        })
      } else {
        const errorData = await response.json()
        console.error('Error response from API:', errorData)
        throw new Error(errorData.error || "Failed to update profile picture")
      }
    } catch (error) {
      console.error("Error updating profile picture:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile picture",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Helper function to convert File to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    } else if (profile?.email) {
      return profile.email.charAt(0).toUpperCase()
    } else {
      return "U"
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <WidgetLayout title="Profile Picture">
            <div className="flex flex-col items-center justify-center space-y-4 p-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt="Profile" />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
              />
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                {uploading ? "Uploading..." : "Change Picture"}
              </Button>
            </div>
          </WidgetLayout>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6">
              <WidgetLayout title="Personal Information">
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input 
                        id="first-name" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input 
                        id="last-name" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <Button 
                    className="mt-4"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </WidgetLayout>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <WidgetLayout title="Security Settings">
                <div className="space-y-4 p-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Password management is handled through Supabase Authentication. 
                      To reset your password, use the "Forgot Password" option on the login page.
                    </p>
                  </div>
                </div>
              </WidgetLayout>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

