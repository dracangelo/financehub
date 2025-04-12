"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface MobileNavProps {
  items: { title: string; href: string }[]
}

export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col space-y-3 p-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-base font-medium ${
            pathname === item.href ? "text-foreground" : "text-foreground/60 hover:text-foreground"
          }`}
        >
          {item.title}
        </Link>
      ))}
    </div>
  )
}

