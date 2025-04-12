import type { Metadata } from "next"
import Link from "next/link"
import { findDuplicateServices } from "@/app/actions/subscriptions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowRight, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Duplicate Service Detection",
  description: "Find overlapping subscriptions and reduce unnecessary costs",
}

export default async function DuplicateServicesPage() {
  const potentialDuplicates = await findDuplicateServices()

  // Calculate potential savings
  const totalPotentialSavings = potentialDuplicates.reduce((total, group) => {
    // For each group, assume we can save the cost of all but the most expensive subscription
    const subscriptions = group.subscriptions || []
    if (subscriptions.length <= 1) return total

    // Sort by monthly amount (convert to monthly first)
    const sortedSubs = [...subscriptions].sort((a, b) => {
      const getMonthlyAmount = (sub) => {
        const amount = sub.amount
        switch (sub.billing_cycle) {
          case "weekly":
            return amount * 4.33
          case "biweekly":
            return amount * 2.17
          case "quarterly":
            return amount / 3
          case "semiannually":
            return amount / 6
          case "annually":
            return amount / 12
          default:
            return amount
        }
      }
      return getMonthlyAmount(b) - getMonthlyAmount(a)
    })

    // Calculate potential savings (all but the most expensive)
    const savings = sortedSubs.slice(1).reduce((sum, sub) => {
      let monthlyAmount = sub.amount
      switch (sub.billing_cycle) {
        case "weekly":
          monthlyAmount = sub.amount * 4.33
          break
        case "biweekly":
          monthlyAmount = sub.amount * 2.17
          break
        case "quarterly":
          monthlyAmount = sub.amount / 3
          break
        case "semiannually":
          monthlyAmount = sub.amount / 6
          break
        case "annually":
          monthlyAmount = sub.amount / 12
          break
      }
      return sum + monthlyAmount
    }, 0)

    return total + savings
  }, 0)

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Duplicate Service Detection</h1>
        <p className="text-muted-foreground">Find overlapping subscriptions and reduce unnecessary costs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Potential Duplicate Groups</CardTitle>
            <CardDescription>Services that may be redundant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{potentialDuplicates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Potential Monthly Savings</CardTitle>
            <CardDescription>If you eliminate redundant services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">${totalPotentialSavings.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {potentialDuplicates.length > 0 ? (
        <div className="space-y-6">
          {potentialDuplicates.map((group, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      {group.category}
                    </CardTitle>
                    <CardDescription>{group.reason}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-amber-50">
                    {group.subscriptions.length} Services
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.subscriptions.map((subscription) => {
                    // Calculate monthly amount
                    let monthlyAmount = subscription.amount
                    switch (subscription.billing_cycle) {
                      case "weekly":
                        monthlyAmount = subscription.amount * 4.33
                        break
                      case "biweekly":
                        monthlyAmount = subscription.amount * 2.17
                        break
                      case "quarterly":
                        monthlyAmount = subscription.amount / 3
                        break
                      case "semiannually":
                        monthlyAmount = subscription.amount / 6
                        break
                      case "annually":
                        monthlyAmount = subscription.amount / 12
                        break
                    }

                    return (
                      <Card key={subscription.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{subscription.name}</h3>
                              <p className="text-sm text-muted-foreground">{subscription.provider}</p>
                            </div>
                            <Badge variant="outline">${monthlyAmount.toFixed(2)}/mo</Badge>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/subscriptions/${subscription.id}`}>
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Details
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-1">Recommendation</h4>
                  <p className="text-sm text-muted-foreground">{group.recommendation}</p>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/subscriptions">
                      Manage Subscriptions
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-medium mb-2">No Duplicate Services Found</h3>
            <p className="text-muted-foreground mb-4">
              Great job! We didn't detect any potentially overlapping subscriptions.
            </p>
            <Button variant="outline" asChild>
              <Link href="/subscriptions">View All Subscriptions</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

