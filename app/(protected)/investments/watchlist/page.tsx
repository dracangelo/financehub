import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { WatchlistContent } from "./watchlist-content"
import { getWatchlistItems } from "@/app/actions/watchlist"

export const dynamic = "force-dynamic"

async function WatchlistData() {
  // Fetch data on the server
  const watchlistItems = await getWatchlistItems()
  
  // Pass the data to the client component
  return <WatchlistContent initialItems={watchlistItems} />
}

export default function WatchlistPage() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
        <p className="text-muted-foreground mt-2">Monitor potential investment opportunities</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <WatchlistData />
      </Suspense>
    </div>
  )
}
