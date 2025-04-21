"use client"

import React, { useState, RefObject } from "react"
import Link from "next/link"
import { Menu, Search, Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface TopNavigationProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
  menuButtonRef?: RefObject<HTMLButtonElement>;
}

export function TopNavigation({ 
  onMenuToggle, 
  isSidebarOpen,
  menuButtonRef 
}: TopNavigationProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search logic here
    console.log("Search query:", searchQuery)
    // Close search on mobile after submitting
    if (window.innerWidth < 768) {
      setIsSearchOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            className="mr-2 h-8 w-8 md:hidden hover:bg-muted transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              onMenuToggle();
            }}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link href="/" className="flex flex-col items-start">
            <span className="hidden md:inline-block font-bold text-xl">DripCheck</span>
            <span className="md:hidden inline-block font-bold text-xl">DripCheck</span>
            <span className="text-xs text-muted-foreground">Flaunting responsibly</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search for larger screens */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 pr-2 w-[180px] lg:w-[240px] rounded-md bg-muted/50 border-muted focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
            />
          </form>

          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden hover:bg-muted transition-colors duration-200"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label={isSearchOpen ? "Close search" : "Open search"}
          >
            {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <div className="hidden md:block mr-2">
            <ThemeToggle />
          </div>
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full hover:bg-primary/10" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]" variant="destructive">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start py-2">
                  <div className="font-medium">Budget Alert</div>
                  <div className="text-xs text-muted-foreground">Dining category exceeded by $45</div>
                  <div className="text-xs text-muted-foreground mt-1">2 hours ago</div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start py-2">
                  <div className="font-medium">New Feature</div>
                  <div className="text-xs text-muted-foreground">ESG Screener now available</div>
                  <div className="text-xs text-muted-foreground mt-1">Yesterday</div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start py-2">
                  <div className="font-medium">Price Alert</div>
                  <div className="text-xs text-muted-foreground">AAPL reached your target price of $198</div>
                  <div className="text-xs text-muted-foreground mt-1">2 days ago</div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-sm">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User avatar" />
                  <AvatarFallback>GU</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search bar - only visible when search is open */}
      {isSearchOpen && (
        <div className="px-4 py-2 border-t border-border md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 pr-2 w-full rounded-md bg-muted/50 border-muted focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  )
}
