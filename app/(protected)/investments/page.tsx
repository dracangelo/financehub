import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvestmentList } from "@/components/investments/investment-list"
import { RebalancingTable } from "@/components/investments/rebalancing-table"
import { AssetClassEditor } from "@/components/investments/asset-class-editor"
import { Skeleton } from "@/components/ui/skeleton"
import { getInvestments, getAssetClasses, getRebalancingRecommendations } from "@/app/actions/investments"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
// import { SeedDatabase } from "@/components/setup/seed-database"
import { AddInvestmentForm } from "@/components/investments/add-investment-form"

export const dynamic = "force-dynamic"

async function getCurrentUserId() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id || "123e4567-e89b-12d3-a456-426614174000"
}

async function InvestmentsContent() {
  const investments = await getInvestments()
  const assetClasses = await getAssetClasses()
  const rebalancingData = await getRebalancingRecommendations()

  // Format investments for the component
  const formattedInvestments = investments.map((inv) => ({
    id: inv.id,
    name: inv.name,
    ticker: inv.ticker || undefined,
    type: inv.type,
    value: inv.value,
    costBasis: inv.cost_basis,
    allocation: inv.allocation,
  }))

  // Format asset classes for the component
  // Since getAssetClasses returns string[], we need to create objects with unique IDs
  const formattedAssetClasses = assetClasses.map((className, index) => ({
    id: `asset-class-${index}`,
    name: className,
    targetAllocation: 0, // Default values, will be updated in the editor
    currentAllocation: 0,
  }))

  return (
    <Tabs defaultValue="portfolio" className="w-full">
      <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
        <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        <TabsTrigger value="rebalancing">Rebalancing</TabsTrigger>
        <TabsTrigger value="allocation">Allocation</TabsTrigger>
      </TabsList>
      <TabsContent value="portfolio">
        <Card>
          <CardHeader>
            <CardTitle>Investment Portfolio</CardTitle>
            <CardDescription>View and manage your investment holdings</CardDescription>
          </CardHeader>
          <CardContent>
            <InvestmentList />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="rebalancing">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Rebalancing</CardTitle>
            <CardDescription>Recommendations to maintain your target asset allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <RebalancingTable
              initialRecommendations={rebalancingData.recommendations}
              initialTotalPortfolioValue={rebalancingData.totalPortfolioValue}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="allocation">
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Adjust your target asset allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <AssetClassEditor initialAssetClasses={formattedAssetClasses} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

export default async function InvestmentsPage() {
  const userId = await getCurrentUserId()
  // Always render dashboard tabs, even if no data
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
        <div className="flex gap-2">
          <AddInvestmentForm />
        </div>
      </div>
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <InvestmentsContent />
      </Suspense>
    </div>
  )
}
