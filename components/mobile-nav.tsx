"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
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
  Repeat 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

interface MobileNavProps {
  items: { 
    title: string; 
    iconName?: string;
    items?: { 
      title: string; 
      href: string; 
      iconName?: string;
      badge?: string;
    }[];
  }[];
  onItemClick?: () => void;
}

export function MobileNav({ items, onItemClick }: MobileNavProps) {
  const pathname = usePathname()
  const [recentPages, setRecentPages] = useState<Array<{ title: string; href: string }>>([])
  const [mounted, setMounted] = useState(false)

  // Get recently visited pages from localStorage (if available)
  useEffect(() => {
    // This ensures the component is only rendered on the client side
    setMounted(true)
    
    try {
      const storedPages = localStorage.getItem("recentPages")
      if (storedPages) {
        setRecentPages(JSON.parse(storedPages))
      }
    } catch (error) {
      console.error("Error getting recent pages:", error)
    }
  }, [])

  // If not mounted yet (server-side), render a simpler version to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <Accordion 
          type="multiple" 
          className="w-full"
          defaultValue={items.map((_, index) => `item-${index}`)}
        >
          {items.map((group, index) => {
            const Icon = group.iconName ? iconMap[group.iconName] : null;
            const isGroupActive = group.items?.some(item => pathname === item.href);
            
            return (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className={cn(
                  "border-b border-border/40 last:border-b-0",
                  isGroupActive ? "bg-accent/30" : ""
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "flex items-center py-3 px-3 transition-all hover:bg-accent/30 rounded-md",
                    isGroupActive ? "font-medium" : ""
                  )}
                >
                  <div className="flex items-center">
                    {Icon && <Icon className="mr-3 h-4 w-4" />}
                    <span>{group.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-2">
                  <div className="flex flex-col space-y-1 pl-6">
                    {group.items?.map((item, itemIndex) => {
                      const ItemIcon = item.iconName ? iconMap[item.iconName] : null;
                      const isActive = pathname === item.href;
                      
                      return (
                        <Link
                          key={itemIndex}
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between py-3 px-3 text-sm rounded-md transition-colors duration-200 hover:bg-accent",
                            isActive ? "bg-accent font-medium" : "text-muted-foreground"
                          )}
                          onClick={onItemClick}
                        >
                          <div className="flex items-center">
                            {ItemIcon && <ItemIcon className="mr-3 h-4 w-4" />}
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
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Recently visited pages section - only rendered on client side */}
      {recentPages.length > 0 && (
        <div className="mb-4 px-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Recently Visited</h3>
          <div className="flex flex-wrap gap-2 px-2">
            {recentPages.slice(0, 3).map((page: { title: string; href: string }) => (
              <Link
                key={page.href}
                href={page.href}
                className="text-xs bg-accent/50 hover:bg-accent px-2 py-1 rounded-md"
                onClick={onItemClick}
              >
                {page.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main navigation */}
      <Accordion 
        type="multiple" 
        className="w-full"
        defaultValue={items.map((_, index) => `item-${index}`)}
      >
        {items.map((group, index) => {
          const Icon = group.iconName ? iconMap[group.iconName] : null;
          // Check if any item in this group is active
          const isGroupActive = group.items?.some(item => pathname === item.href);
          
          return (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className={cn(
                "border-b border-border/40 last:border-b-0",
                isGroupActive ? "bg-accent/30" : ""
              )}
            >
              <AccordionTrigger 
                className={cn(
                  "flex items-center py-3 px-3 transition-all hover:bg-accent/30 rounded-md",
                  isGroupActive ? "font-medium" : ""
                )}
              >
                <div className="flex items-center">
                  {Icon && <Icon className="mr-3 h-4 w-4" />}
                  <span>{group.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2">
                <div className="flex flex-col space-y-1 pl-6">
                  {group.items?.map((item, itemIndex) => {
                    const ItemIcon = item.iconName ? iconMap[item.iconName] : null;
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link
                        key={itemIndex}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between py-3 px-3 text-sm rounded-md transition-colors duration-200 hover:bg-accent",
                          isActive ? "bg-accent font-medium" : "text-muted-foreground"
                        )}
                        onClick={onItemClick}
                      >
                        <div className="flex items-center">
                          {ItemIcon && <ItemIcon className="mr-3 h-4 w-4" />}
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
    </div>
  )
}
