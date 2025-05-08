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
// Using API endpoint instead of server action
// import { addToWatchlist } from "@/app/actions/watchlist"
import { toast } from "sonner"
import { Search, Loader2, AlertTriangle, Bell } from "lucide-react"

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
  
  // Get user ID from session
  const [userId, setUserId] = useState<string | null>(null)
  
  // Fetch user ID on component mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          if (data.user?.id) {
            setUserId(data.user.id)
          }
        }
      } catch (error) {
        console.error('Error fetching user session:', error)
      }
    }
    
    fetchUserId()
  }, [])
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    
    if (!userId) {
      toast.error('User authentication required')
      setIsSubmitting(false)
      return
    }
    
    try {
      // Prepare the data to send to the API
      const data = {
        userId,
        ticker: tickerValue,
        name: nameValue,
        price: parseFloat(priceValue) || 0,
        targetPrice: targetPriceValue ? parseFloat(targetPriceValue) : null,
        notes: notesValue,
        sector: sectorValue,
        priceAlerts: priceAlertEnabled,
        alertThreshold: alertThresholdValue ? parseFloat(alertThresholdValue) : null
      }
      
      // Call the API endpoint
      const response = await fetch('/api/watchlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
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
        // Use relative URL path instead of absolute URL
        const response = await fetch(`/api/finnhub`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
          // Add these options to improve fetch reliability
          cache: 'no-store',
          next: { revalidate: 0 }
        })
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Search failed:', errorText);
          throw new Error(`Search failed: ${response.status} ${errorText}`);
        }
        
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
        toast.error('Failed to search for stocks. Please try again.')
        setSearchResults([])
        setShowSearchResults(false)
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
      // Use relative URL path instead of absolute URL
      const response = await fetch(`/api/finnhub?symbol=${encodeURIComponent(symbol)}`, {
        // Add these options to improve fetch reliability
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Quote fetch failed:', errorText);
        throw new Error(`Failed to fetch quote: ${response.status} ${errorText}`);
      }
      
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
      toast.error('Failed to fetch current price. Using placeholder value.')
      // Set a placeholder price if the API call fails
      setPriceValue('0')
      setTargetPriceValue('0')
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
          <DialogDescription>
            Add an investment to your watchlist to track its performance and set price alerts.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-2">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="search" className="text-right">
                Search Stock
              </Label>
              <div className="relative col-span-3">
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
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticker" className="text-right">
                Ticker
              </Label>
              <Input
                id="ticker"
                name="ticker"
                value={tickerValue}
                onChange={(e) => setTickerValue(e.target.value.toUpperCase())}
                placeholder="AAPL"
                required
                className="uppercase col-span-1"
              />
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder="Apple Inc."
                required
                className="col-span-1"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Current Price
              </Label>
              <div className="relative col-span-1">
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="0.00"
                  required
                />
                {isFetchingQuote && (
                  <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Label htmlFor="targetPrice" className="text-right">
                Target Price
              </Label>
              <Input
                id="targetPrice"
                name="targetPrice"
                type="number"
                step="0.01"
                value={targetPriceValue}
                onChange={(e) => setTargetPriceValue(e.target.value)}
                placeholder="0.00"
                className="col-span-1"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sector" className="text-right">
                Sector
              </Label>
              <Select 
                name="sector" 
                value={sectorValue} 
                onValueChange={setSectorValue}
              >
                <SelectTrigger className="col-span-3">
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
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add your notes about this investment"
                className="col-span-3"
              />
            </div>
            
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-medium mb-3">Price Alert Settings</h3>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priceAlertEnabled" className="text-right">
                  Price Alerts
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="priceAlertEnabled"
                    name="priceAlertEnabled"
                    checked={priceAlertEnabled}
                    onCheckedChange={setPriceAlertEnabled}
                  />
                  <Label htmlFor="priceAlertEnabled">
                    Enable price alerts
                  </Label>
                </div>
              </div>
              
              {priceAlertEnabled && (
                <div className="grid grid-cols-4 items-center gap-4 mt-2">
                  <Label htmlFor="alertThreshold" className="text-right">
                    Alert Threshold
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <Input
                      id="alertThreshold"
                      name="alertThreshold"
                      type="number"
                      step="0.01"
                      value={alertThresholdValue}
                      onChange={(e) => setAlertThresholdValue(e.target.value)}
                      placeholder="Price threshold for alerts"
                    />
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm text-muted-foreground">
                        You'll be notified when the price reaches this threshold.
                      </p>
                      
                      {priceValue && alertThresholdValue && (
                        <div className="text-sm">
                          <span className={`${parseFloat(alertThresholdValue) > parseFloat(priceValue) ? 'text-amber-500' : 'text-green-500'}`}>
                            {parseFloat(alertThresholdValue) > parseFloat(priceValue) ? (
                              <>
                                <AlertTriangle className="inline h-3 w-3 mr-1" />
                                {((parseFloat(alertThresholdValue) - parseFloat(priceValue)) / parseFloat(priceValue) * 100).toFixed(2)}% above current price
                              </>
                            ) : (
                              <>
                                <Bell className="inline h-3 w-3 mr-1" />
                                Alert will trigger immediately (price is already above threshold)
                              </>
                            )}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex space-x-2 mt-1">
                        {priceValue && (
                          <>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => setAlertThresholdValue((parseFloat(priceValue) * 1.05).toFixed(2))}
                            >
                              +5%
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => setAlertThresholdValue((parseFloat(priceValue) * 1.1).toFixed(2))}
                            >
                              +10%
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => setAlertThresholdValue((parseFloat(priceValue) * 1.2).toFixed(2))}
                            >
                              +20%
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
