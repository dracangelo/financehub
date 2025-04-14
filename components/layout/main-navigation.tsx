"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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
import { LogOut, Settings, User, Search, X } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { NavItems } from "./nav-items"

interface MainNavigationProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  navItems?: { title: string; href: string }[];
}

export function MainNavigation({
  className,
  isOpen = true,
  onClose,
  navItems,
}: MainNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [searchQuery, setSearchQuery] = useState("")

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  }, [pathname, onClose]);

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search logic here
    console.log("Search query:", searchQuery)
  }

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-background transition-all duration-300 ease-in-out",
        "w-64 border-r p-4 shadow-lg md:shadow-none",
        "md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      <div className="flex items-center justify-between mb-6 md:hidden">
        <Link href="/" className="flex items-center space-x-2">
          <span className="inline-block font-bold text-xl">Finance Tracker</span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-muted">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mb-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 pr-2 rounded-md bg-muted/50 border-muted focus-visible:ring-primary/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search navigation"
          />
        </form>
      </div>

      <div className="overflow-y-auto flex-grow">
        {navItems ? (
          <ul className="space-y-1">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center py-2 px-3 text-sm rounded-md hover:bg-accent transition-colors duration-200",
                    pathname === item.href ? "bg-accent font-medium" : "text-muted-foreground"
                  )}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <NavItems className="mb-4" />
        )}
      </div>

      <div className="mt-auto pt-4 border-t md:block hidden">
        <ThemeToggle />
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
    </aside>
  )
}
