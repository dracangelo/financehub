import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { IncomeSourcesList } from "@/components/income/income-sources-list"
import { IncomeSummaryChart } from "@/components/income/income-summary-chart"
import { getIncomeSources } from "@/app/actions/income-sources"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IncomeAnalyticsClient } from "@/components/income/income-analytics-client"

// Ensure this page is always dynamic and never cached
export const dynamic = "force-dynamic"
export const revalidate = 0

async function IncomeOverviewContent() {
  // Use current timestamp to ensure we get fresh data
  const timestamp = Date.now()
  const sources = await getIncomeSources(timestamp)

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Income Overview</h2>
      <p className="text-muted-foreground mb-2">
        Track and manage your income sources here.
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        Note: All amounts are normalized to monthly values (e.g., annual income is divided by 12, weekly income is multiplied by 4.33)
      </p>
      <IncomeSummaryChart sources={sources} />
      <IncomeSourcesList initialSources={sources} />
    </div>
  )
}

async function IncomeAnalyticsContent() {
  // Use current timestamp to ensure we get fresh data
  const timestamp = Date.now()
  const sources = await getIncomeSources(timestamp)
  
  return (
    <IncomeAnalyticsClient 
      sources={sources}
    />
  )
}

export default async function IncomePage() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Income</h1>
        <p className="text-muted-foreground mt-2">Manage your income sources and track your earnings</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <IncomeOverviewContent />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-4">
          <Suspense fallback={
            <div className="grid grid-cols-1 gap-6">
              <Skeleton className="h-[300px] w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            </div>
          }>
            <IncomeAnalyticsContent />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
