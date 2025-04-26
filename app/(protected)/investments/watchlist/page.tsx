import { WatchlistContent } from "./watchlist-content"
import { getWatchlistItems } from "@/app/actions/watchlist"

// Use dynamic rendering for this page to ensure fresh data
export const dynamic = "force-dynamic"

// Define the WatchlistItem type to match what's expected by the component
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

// Use a simple async component without Suspense
export default async function WatchlistPage() {
  try {
    // Fetch data on the server
    const { items, error } = await getWatchlistItems()
    
    if (error) {
      console.error("Error fetching watchlist items:", error)
    }
    
    // Map the database items to match the expected WatchlistItem interface
    const mappedItems: WatchlistItem[] = Array.isArray(items) 
      ? items.map(item => ({
          id: item.id,
          ticker: item.ticker,
          name: item.name,
          price: item.price || 0,
          target_price: item.target_price || null,
          notes: item.notes || "",
          sector: item.sector || "",
          created_at: item.created_at,
          updated_at: item.updated_at,
          // Map price_alert_enabled to price_alerts
          price_alerts: item.price_alert_enabled || item.price_alerts || false,
          alert_threshold: item.alert_threshold || null
        }))
      : []
    
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground mt-2">Monitor potential investment opportunities</p>
        </div>

        <WatchlistContent initialItems={mappedItems} />
      </div>
    )
  } catch (err) {
    console.error("Error in WatchlistPage:", err)
    
    // Return a simple error state
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground mt-2">Monitor potential investment opportunities</p>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-red-500">Error loading watchlist data. Please try again later.</p>
          <WatchlistContent initialItems={[]} />
        </div>
      </div>
    )
  }
}
