"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { addToWatchlist } from "@/app/actions/watchlist"
import { toast } from "sonner"
import { Search, Loader2 } from "lucide-react"

type AddToWatchlistProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type StockSearchResult = {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

type StockQuote = {
  c: number // Current price
  h: number // High price of the day
  l: number // Low price of the day
  o: number // Open price of the day
  pc: number // Previous close price
  d: number // Change
  dp: number // Percent change
}

const SECTORS = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Communication Services",
  "Industrials",
  "Consumer Defensive",
  "Energy",
  "Basic Materials",
  "Real Estate",
  "Utilities"
]

export function AddToWatchlist({ open, onOpenChange }: AddToWatchlistProps) {
  const [tickerValue, setTickerValue] = useState('')
  const [nameValue, setNameValue] = useState('')
  const [priceValue, setPriceValue] = useState('')
  const [targetPriceValue, setTargetPriceValue] = useState('')
  const [notesValue, setNotesValue] = useState('')
  const [sectorValue, setSectorValue] = useState('')
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(false)
  const [alertThresholdValue, setAlertThresholdValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // New states for API integration
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isFetchingQuote, setIsFetchingQuote] = useState(false)
  
  const resetForm = () => {
    setTickerValue('')
    setNameValue('')
    setPriceValue('')
    setTargetPriceValue('')
    setNotesValue('')
    setSectorValue('')
    setPriceAlertEnabled(false)
    setAlertThresholdValue('')
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }
  
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await addToWatchlist(formData)
      if (result.success) {
        toast.success("Investment added to watchlist")
        resetForm()
        onOpenChange(false)
      } else {
        toast.error("Failed to add investment: " + (result.error || "Unknown error"))
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Search for stocks as user types
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        setShowSearchResults(false)
        return
      }
      
      setIsSearching(true)
      try {
        const response = await fetch('/api/finnhub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery })
        })
        
        if (!response.ok) throw new Error('Search failed')
        
        const data = await response.json()
        if (data.result && Array.isArray(data.result)) {
          // Filter to common stock types and limit to 5 results
          const filteredResults = data.result
            .filter((item: StockSearchResult) => 
              ['Common Stock', 'ETP', 'ETF', 'ADR', ''].includes(item.type))
            .slice(0, 5)
          
          setSearchResults(filteredResults)
          setShowSearchResults(filteredResults.length > 0)
        }
      } catch (error) {
        console.error('Error searching stocks:', error)
        toast.error('Failed to search for stocks')
      } finally {
        setIsSearching(false)
      }
    }, 500) // Debounce for 500ms
    
    return () => clearTimeout(delayDebounce)
  }, [searchQuery])
  
  // Fetch stock quote when ticker is selected
  const fetchStockQuote = async (symbol: string) => {
    setIsFetchingQuote(true)
    try {
      const response = await fetch(`/api/finnhub?symbol=${encodeURIComponent(symbol)}`)
      
      if (!response.ok) throw new Error('Failed to fetch quote')
      
      const data: StockQuote = await response.json()
      
      // Update form with real data
      setPriceValue(data.c.toString())
      
      // If price change is positive, suggest a target price 5% higher
      // If negative, suggest a target price at previous close
      if (data.dp > 0) {
        setTargetPriceValue((data.c * 1.05).toFixed(2))
      } else {
        setTargetPriceValue(data.pc.toFixed(2))
      }
      
      toast.success(`Loaded current price: $${data.c.toFixed(2)}`)
    } catch (error) {
      console.error('Error fetching stock quote:', error)
      toast.error('Failed to fetch current price')
    } finally {
      setIsFetchingQuote(false)
    }
  }
  
  // Select a stock from search results
  const selectStock = (stock: StockSearchResult) => {
    setTickerValue(stock.symbol)
    setNameValue(stock.description)
    setShowSearchResults(false)
    fetchStockQuote(stock.symbol)
  }
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setTickerValue(value.toUpperCase())
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
          <DialogDescription>
            Add an investment to your watchlist to track its performance and set price alerts.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-4">
              <Label htmlFor="search">Search for a stock</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by company name or ticker..."
                  className="pl-8 pr-8"
                />
                {isSearching && (
                  <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                
                {showSearchResults && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                    <ul className="py-1">
                      {searchResults.map((result) => (
                        <li 
                          key={result.symbol} 
                          className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between"
                          onClick={() => selectStock(result)}
                        >
                          <span className="font-medium">{result.symbol}</span>
                          <span className="text-muted-foreground truncate ml-2">{result.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-span-1">
              <Label htmlFor="ticker">Ticker</Label>
              <Input
                id="ticker"
                name="ticker"
                value={tickerValue}
                onChange={(e) => setTickerValue(e.target.value.toUpperCase())}
                placeholder="AAPL"
                required
                className="mt-1 uppercase"
              />
            </div>
            
            <div className="col-span-3">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                name="name"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder="Apple Inc."
                required
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Current Price ($)</Label>
              <div className="relative">
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="0.00"
                  required
                  className="mt-1"
                />
                {isFetchingQuote && (
                  <Loader2 className="absolute right-2 top-3.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="targetPrice">Target Price ($)</Label>
              <Input
                id="targetPrice"
                name="targetPrice"
                type="number"
                step="0.01"
                value={targetPriceValue}
                onChange={(e) => setTargetPriceValue(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="sector">Sector</Label>
            <Select 
              name="sector" 
              value={sectorValue} 
              onValueChange={setSectorValue}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a sector" />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Add your notes about this investment"
              className="mt-1"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="priceAlertEnabled"
                name="priceAlertEnabled"
                checked={priceAlertEnabled}
                onCheckedChange={setPriceAlertEnabled}
              />
              <Label htmlFor="priceAlertEnabled">Enable price alerts</Label>
            </div>
            
            {priceAlertEnabled && (
              <div>
                <Label htmlFor="alertThreshold">Alert Threshold ($)</Label>
                <Input
                  id="alertThreshold"
                  name="alertThreshold"
                  type="number"
                  step="0.01"
                  value={alertThresholdValue}
                  onChange={(e) => setAlertThresholdValue(e.target.value)}
                  placeholder="Price threshold for alerts"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  You'll be notified when the price reaches this threshold.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add to Watchlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
