"use client"

import { useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getClientSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { User } from "@/lib/types/user"
import { updateLastActiveTimestamp } from "@/lib/services/user-service"
import { useUserProfile } from "@/hooks/use-user-profile"
import { Skeleton } from "@/components/ui/skeleton"

interface UserNavProps {
  user: User
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter()
  const supabase = getClientSupabaseClient()
  const { profile, loading, refreshProfile } = useUserProfile(user)
  
  // Force refresh profile on mount to ensure we have the latest data
  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const handleSignOut = async () => {
    if (!supabase) {
      console.error("Failed to get Supabase client")
      return
    }
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Update last active timestamp when user opens dropdown
  const handleOpenDropdown = async () => {
    if (user && user.id) {
      await updateLastActiveTimestamp(user.id)
    }
  }
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    if (profile?.full_name) {
      const nameParts = profile.full_name.split(" ")
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      }
      return profile.full_name[0].toUpperCase()
    }
    if (user.user_metadata?.username) {
      return user.user_metadata.username.charAt(0).toUpperCase()
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && handleOpenDropdown()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          {loading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={profile?.avatar_url ? `${profile.avatar_url}&t=${Date.now()}` : (user.user_metadata?.avatar_url || "")} 
                alt={user.email || ""} 
                onError={(e) => {
                  console.log("Error loading avatar image:", e);
                  // Force refresh profile on image load error
                  refreshProfile();
                }}
              />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.username || user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

