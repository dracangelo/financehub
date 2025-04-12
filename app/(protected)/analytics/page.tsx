import { Suspense } from "react"
import { BarChart3Icon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SpendingHeatmap } from "@/components/visualizations/spending-heatmap"
import { MerchantNetwork } from "@/components/visualizations/merchant-network"
import { supabase } from "@/lib/supabase"

// Mock user ID since authentication is disabled
const MOCK_USER_ID = "123e4567-e89b-12d3-a456-426614174000"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-muted-foreground">Gain deeper insights into your spending patterns and financial behavior</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Suspense fallback={<VisualizationSkeleton title="Spending Heatmap" />}>
          <SpendingHeatmapContent />
        </Suspense>

        <Suspense fallback={<VisualizationSkeleton title="Merchant Network" />}>
          <MerchantNetworkContent />
        </Suspense>
      </div>
    </div>
  )
}

async function SpendingHeatmapContent() {
  // Fetch transactions with location data
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", MOCK_USER_ID)
    .not("latitude", "is", null)
    .order("date", { ascending: false })

  return <SpendingHeatmap transactions={transactions || []} />
}

async function MerchantNetworkContent() {
  // Fetch transactions with merchant data
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", MOCK_USER_ID)
    .not("merchant_name", "is", null)
    .order("date", { ascending: false })

  return <MerchantNetwork transactions={transactions || []} />
}

function VisualizationSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Loading visualization data...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
          <BarChart3Icon className="h-12 w-12 text-muted-foreground mb-4" />
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardContent>
    </Card>
  )
}

