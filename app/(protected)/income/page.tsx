import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { IncomeSourcesList } from "@/components/income/income-sources-list"
import { IncomeSummaryChart } from "@/components/income/income-summary-chart"
import { getIncomeSources } from "@/app/actions/income-sources"

export const dynamic = "force-dynamic"

async function IncomeContent() {
 const sources = await getIncomeSources()

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

export default async function IncomePage() {
 return (
   <div className="flex flex-col gap-4 p-4 sm:p-8">
     <div>
       <h1 className="text-2xl font-bold tracking-tight">Income</h1>
       <p className="text-muted-foreground mt-2">Manage your income sources and track your earnings</p>
     </div>

     <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
       <IncomeContent />
     </Suspense>
   </div>
 )
}

