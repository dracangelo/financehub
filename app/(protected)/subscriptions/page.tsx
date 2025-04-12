import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubscriptionsList } from "@/components/subscriptions/subscriptions-list"
import { SubscriptionROI } from "@/components/subscriptions/subscription-roi"
import { SubscriptionDuplicates } from "@/components/subscriptions/subscription-duplicates"
import { Repeat } from "lucide-react"

export const dynamic = "force-dynamic"

export default function SubscriptionsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Subscriptions"
        text="Monitor and manage your recurring subscriptions."
        icon={<Repeat className="h-6 w-6" />}
      />


      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="roi">Value Analysis</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <SubscriptionsList />
          </Suspense>
        </TabsContent>
        <TabsContent value="roi" className="mt-4">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <SubscriptionROI />
          </Suspense>
        </TabsContent>
        <TabsContent value="duplicates" className="mt-4">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <SubscriptionDuplicates />
          </Suspense>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

