"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, Bell, Edit, MoreHorizontal, Plus, Trash } from "lucide-react"
import { updateWatchlistItem, removeFromWatchlist } from "@/app/actions/watchlist"
import { toast } from "sonner"

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

type WatchlistTableProps = {
  items: WatchlistItem[]
  onAddNew: () => void
}

export function WatchlistTable({ items, onAddNew }: WatchlistTableProps) {
  const [sortColumn, setSortColumn] = useState<keyof WatchlistItem>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  
  // Handle sorting
  const handleSort = (column: keyof WatchlistItem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }
  
  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]
    
    if (aValue === null) return sortDirection === "asc" ? -1 : 1
    if (bValue === null) return sortDirection === "asc" ? 1 : -1
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue)
    }
    
    // For numbers and other types
    return sortDirection === "asc" 
      ? (aValue < bValue ? -1 : 1) 
      : (bValue < aValue ? -1 : 1)
  })
  
  // Handle edit
  const handleEdit = (item: WatchlistItem) => {
    setSelectedItem(item)
    setEditDialogOpen(true)
  }
  
  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this item from your watchlist?")) {
      const result = await removeFromWatchlist(id)
      if (result.success) {
        toast.success("Item removed from watchlist")
      } else {
        toast.error("Failed to remove item: " + (result.error || "Unknown error"))
      }
    }
  }
  
  // Handle update
  const handleUpdate = async (formData: FormData) => {
    const result = await updateWatchlistItem(formData)
    if (result.success) {
      toast.success("Watchlist item updated")
      setEditDialogOpen(false)
    } else {
      toast.error("Failed to update: " + (result.error || "Unknown error"))
    }
  }
  
  // Calculate price difference from target
  const getPriceDifference = (current: number, target: number | null) => {
    if (target === null) return null
    const diff = ((target - current) / current) * 100
    return diff.toFixed(2)
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Watchlist</h2>
        <Button onClick={onAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Investment
        </Button>
      </div>
      
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground mb-4">
              Add investments to track their performance and set price alerts
            </p>
            <Button onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Investment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("ticker")}>
                  <div className="flex items-center">
                    Ticker
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("price")}>
                  <div className="flex items-center">
                    Current Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("target_price")}>
                  <div className="flex items-center">
                    Target Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("sector")}>
                  <div className="flex items-center">
                    Sector
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((item) => {
                const priceDiff = getPriceDifference(item.price, item.target_price)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.ticker}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {item.target_price ? (
                        <div className="flex flex-col">
                          <span>${item.target_price.toFixed(2)}</span>
                          {priceDiff && (
                            <span className={`text-xs ${parseFloat(priceDiff) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {parseFloat(priceDiff) > 0 ? '+' : ''}{priceDiff}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>{item.sector || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        {item.price_alerts && (
                          <Bell className="h-4 w-4 text-amber-500" aria-label="Price alert enabled" />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item.id)}>
                              <Trash className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Watchlist Item</DialogTitle>
            <DialogDescription>
              Update details for {selectedItem?.ticker} - {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <form action={handleUpdate}>
            <input type="hidden" name="id" value={selectedItem?.id} />
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetPrice" className="text-right">
                  Target Price
                </Label>
                <Input
                  id="targetPrice"
                  name="targetPrice"
                  type="number"
                  step="0.01"
                  defaultValue={selectedItem?.target_price || ''}
                  placeholder="Set a target price"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={selectedItem?.notes || ''}
                  placeholder="Add your notes about this investment"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priceAlertEnabled" className="text-right">
                  Price Alerts
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="priceAlertEnabled"
                    name="priceAlertEnabled"
                    defaultChecked={selectedItem?.price_alerts}
                  />
                  <Label htmlFor="priceAlertEnabled">
                    Enable price alerts
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="alertThreshold" className="text-right">
                  Alert Threshold
                </Label>
                <Input
                  id="alertThreshold"
                  name="alertThreshold"
                  type="number"
                  step="0.01"
                  defaultValue={selectedItem?.alert_threshold || ''}
                  placeholder="Price threshold for alerts"
                  className="col-span-3"
                  disabled={!selectedItem?.price_alerts}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
