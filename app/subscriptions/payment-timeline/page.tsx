import type { Metadata } from "next"
import { optimizePaymentSchedule } from "@/app/actions/subscriptions"
import { PaymentTimelineChart } from "@/components/subscriptions/payment-timeline-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, CreditCard, DollarSign, RefreshCw } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Payment Timeline",
  description: "Visualize and optimize your payment schedule for better cash flow",
}

export default async function PaymentTimelinePage() {
  const paymentSchedule = await optimizePaymentSchedule()

  // Calculate total monthly payments
  const totalMonthlyPayments = paymentSchedule.currentSchedule.reduce((sum, payment) => sum + payment.amount, 0)

  // Calculate total optimized payments
  const totalOptimizedPayments = paymentSchedule.optimizedSchedule.reduce((sum, payment) => sum + payment.amount, 0)

  // Calculate cash flow improvement
  const cashFlowImprovement = paymentSchedule.cashFlowImprovement

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Payment Timeline</h1>
        <p className="text-muted-foreground">Visualize and optimize your payment schedule for better cash flow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Monthly Payments</CardTitle>
            <CardDescription>All bills and subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalMonthlyPayments.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Cash Flow Improvement</CardTitle>
            <CardDescription>With optimized scheduling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">${cashFlowImprovement.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{paymentSchedule.paymentMethods.length}</div>
            <div className="flex gap-1 mt-2">
              {paymentSchedule.paymentMethods.map((method, index) => (
                <Badge key={index} variant="outline">
                  {method.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Payment Timeline</TabsTrigger>
          <TabsTrigger value="optimized">Optimized Schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Payment Schedule</CardTitle>
              <CardDescription>Visualization of your current payment dates throughout the month</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentTimelineChart payments={paymentSchedule.currentSchedule} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="optimized" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimized Payment Schedule</CardTitle>
              <CardDescription>Recommended payment dates to improve cash flow</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentTimelineChart payments={paymentSchedule.optimizedSchedule} />

              <div className="mt-6 space-y-4">
                <h3 className="font-medium">Optimization Recommendations</h3>

                {paymentSchedule.recommendations.map((recommendation, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      {recommendation.type === "reschedule" ? (
                        <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      ) : recommendation.type === "payment_method" ? (
                        <CreditCard className="h-5 w-5 text-blue-500 mt-0.5" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-blue-500 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-medium">{recommendation.title}</h4>
                        <p className="text-sm text-muted-foreground">{recommendation.description}</p>

                        {recommendation.savings > 0 && (
                          <div className="mt-2 flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-500">
                              Potential savings: ${recommendation.savings.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end mt-6">
                  <Button asChild>
                    <Link href="/subscriptions/apply-optimization">Apply Optimized Schedule</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

