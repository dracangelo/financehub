"use client"

import { useState } from "react"
import { WatchlistTable } from "@/components/investments/watchlist-table"
import { AddToWatchlist } from "@/components/investments/add-to-watchlist"

type WatchlistItem = {
  id: string
  ticker: string
  name: string
  price: number
  target_price: number | null
  notes: string
  sector: string
  created_at: string
  updated_at: string
  price_alerts: boolean
  alert_threshold: number | null
}

type WatchlistContentProps = {
  initialItems: WatchlistItem[]
}

export function WatchlistContent({ initialItems }: WatchlistContentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  return (
    <div className="space-y-6">
      <WatchlistTable 
        items={initialItems} 
        onAddNew={() => setIsAddDialogOpen(true)} 
      />
      
      <AddToWatchlist 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />
    </div>
  )
}
