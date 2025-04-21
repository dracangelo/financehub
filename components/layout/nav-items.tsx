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
import { Badge } from "@/components/ui/badge"
import { navItems } from "@/lib/utils/navigation"

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

export function NavItems({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <Accordion 
      type="multiple" 
      className={cn("w-full", className)}
      defaultValue={navItems.map((_, index) => `item-${index}`)} // Open all by default on desktop
    >
      {navItems.map((group, index) => {
        const Icon = iconMap[group.iconName || ""]
        // Check if any item in this group is active
        const isGroupActive = group.items?.some(item => pathname === item.href)
        
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
                {group.items?.map((item, itemIndex) => {
                  const ItemIcon = iconMap[item.iconName || ""]
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={itemIndex}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between py-2 px-2 text-sm rounded-md transition-colors duration-200 hover:bg-accent",
                        isActive ? "bg-accent font-medium" : "text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center">
                        {ItemIcon && <ItemIcon className="mr-2 h-4 w-4" />}
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
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