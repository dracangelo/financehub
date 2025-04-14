"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Home,
  CreditCard,
  PiggyBank,
  BarChart3,
  Receipt,
  Calendar,
  DollarSign,
  Wallet,
  BellRing,
  Target,
  Settings,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  Calculator,
  Shield,
  Repeat,
} from "lucide-react"

// Define the icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  CreditCard,
  PiggyBank,
  BarChart3,
  Receipt,
  Calendar,
  DollarSign,
  Wallet,
  BellRing,
  Target,
  Settings,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  Calculator,
  Shield,
  Repeat,
}

// Define the navigation structure
const navItems = [
  {
    title: "Overview",
    iconName: "Home",
    items: [{ title: "Dashboard", href: "/dashboard", iconName: "BarChart3" }],
  },
  {
    title: "Money Management",
    iconName: "Wallet",
    items: [
      { title: "Accounts", href: "/accounts", iconName: "CreditCard" },
      { title: "Transactions", href: "/transactions", iconName: "Receipt" },
      { title: "Income", href: "/income", iconName: "TrendingUp" },
      { title: "Expenses", href: "/expenses", iconName: "TrendingDown" },
      { title: "Debt Management", href: "/debt-management", iconName: "CreditCard" },
      { title: "Subscriptions", href: "/subscriptions", iconName: "Repeat" },
    ],
  },
  {
    title: "Planning",
    iconName: "Calendar",
    items: [
      { title: "Budgets", href: "/budgets", iconName: "PiggyBank" },
      { title: "Goals", href: "/goals", iconName: "Target" },
      { title: "Bills", href: "/bills", iconName: "FileText" },
      { title: "Tax Planner", href: "/tax-planner", iconName: "Calculator" },
      { title: "Emergency Fund", href: "/emergency-fund", iconName: "Shield" },
    ],
  },
  {
    title: "Investments",
    iconName: "TrendingUp",
    items: [
      { title: "Portfolio", href: "/investments/portfolio", iconName: "DollarSign" },
      { title: "ESG Screener", href: "/investments/esg-screener", iconName: "Landmark" },
      { title: "Watchlist", href: "/investments/watchlist", iconName: "Clock" },
    ],
  },
  {
    title: "Reports & Analytics",
    iconName: "BarChart3",
    items: [
      { title: "Reports", href: "/reports", iconName: "BarChart3" },
      { title: "Calendar", href: "/calendar", iconName: "Calendar" },
    ],
  },
  {
    title: "Settings",
    iconName: "Settings",
    items: [
      { title: "Settings", href: "/settings", iconName: "Settings" },
      { title: "Notifications", href: "/notifications", iconName: "BellRing" },
    ],
  },
]

export function NavItems({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <Accordion 
      type="multiple" 
      className={cn("w-full", className)}
      defaultValue={navItems.map((_, index) => `item-${index}`)} // Open all by default on desktop
    >
      {navItems.map((group, index) => {
        const Icon = iconMap[group.iconName]
        // Check if any item in this group is active
        const isGroupActive = group.items.some(item => pathname === item.href)
        
        return (
          <AccordionItem 
            key={index} 
            value={`item-${index}`}
            className={cn(
              "border-b-0 transition-colors duration-200",
              isGroupActive ? "bg-accent/50" : ""
            )}
          >
            <AccordionTrigger 
              className={cn(
                "flex items-center py-2 px-1 transition-all hover:bg-accent/30 rounded-md",
                isGroupActive ? "font-medium" : ""
              )}
            >
              <div className="flex items-center">
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                <span>{group.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-2">
              <div className="flex flex-col space-y-1 pl-6">
                {group.items.map((item, itemIndex) => {
                  const ItemIcon = iconMap[item.iconName]
                  return (
                    <Link
                      key={itemIndex}
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 px-2 text-sm rounded-md transition-colors duration-200 hover:bg-accent",
                        pathname === item.href ? "bg-accent font-medium" : "text-muted-foreground"
                      )}
                    >
                      {ItemIcon && <ItemIcon className="mr-2 h-4 w-4" />}
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
} 