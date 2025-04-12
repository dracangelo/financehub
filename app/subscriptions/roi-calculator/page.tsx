import type { Metadata } from "next"
import { getSubscriptionROI } from "@/app/actions/subscriptions"
import { SubscriptionValueMatrix } from "@/components/subscriptions/subscription-value-matrix"
import { SubscriptionROIList } from "@/components/subscriptions/subscription-roi-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Subscription ROI Calculator",
  description: "Analyze the value of your subscriptions based on usage and cost",
}

export default async function SubscriptionROIPage() {
  const subscriptionsWithROI = await getSubscriptionROI()

  // Calculate total monthly cost
  const totalMonthlyCost = subscriptionsWithROI.reduce((sum, sub) => sum + sub.monthlyAmount, 0)

  // Group by value category
  const groupedByValue = subscriptionsWithROI.reduce((acc, sub) => {
    if (!acc[sub.valueCategory]) {
      acc[sub.valueCategory] = []
    }
    acc[sub.valueCategory].push(sub)
    return acc
  }, {})

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Subscription ROI Calculator</h1>
        <p className="text-muted-foreground">Analyze the value of your subscriptions based on usage and cost</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Monthly Cost</CardTitle>
            <CardDescription>All active subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalMonthlyCost.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Poor Value</CardTitle>
            <CardDescription>Consider cancelling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {groupedByValue.poor ? groupedByValue.poor.length : 0}
            </div>
            {groupedByValue.poor && (
              <div className="text-sm text-muted-foreground">
                ${groupedByValue.poor.reduce((sum, sub) => sum + sub.monthlyAmount, 0).toFixed(2)}/month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Good Value</CardTitle>
            <CardDescription>Worth keeping</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {groupedByValue.good ? groupedByValue.good.length : 0}
            </div>
            {groupedByValue.good && (
              <div className="text-sm text-muted-foreground">
                ${groupedByValue.good.reduce((sum, sub) => sum + sub.monthlyAmount, 0).toFixed(2)}/month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matrix" className="w-full">
        <TabsList>
          <TabsTrigger value="matrix">Value Matrix</TabsTrigger>
          <TabsTrigger value="list">Detailed List</TabsTrigger>
        </TabsList>
        <TabsContent value="matrix" className="mt-4">
          <SubscriptionValueMatrix subscriptions={subscriptionsWithROI} />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <SubscriptionROIList subscriptions={subscriptionsWithROI} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

