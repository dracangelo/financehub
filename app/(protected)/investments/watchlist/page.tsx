import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

async function WatchlistContent() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Investment Watchlist</h2>
      <p className="text-muted-foreground">Track potential investments here. This page is under development.</p>
    </div>
  )
}

export default function WatchlistPage() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
        <p className="text-muted-foreground mt-2">Monitor potential investment opportunities</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <WatchlistContent />
      </Suspense>
    </div>
  )
}

