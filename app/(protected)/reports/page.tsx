"use client"

import { Suspense } from "react"
import { WidgetLayout } from "@/components/dashboard/widget-layout"
import { TimeBasedFilters } from "@/components/dashboard/time-based-filters"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinancialHealthScore } from "@/components/dashboard/financial-health-score"
import { NetWorthTimeline } from "@/components/dashboard/net-worth-timeline"
import { RadarChart } from "@/components/dashboard/radar-chart"
import { SankeyDiagram } from "@/components/dashboard/sankey-diagram"

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <TimeBasedFilters onChange={(range) => console.log(range)} defaultValue="30d" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income-expense">Income & Expenses</TabsTrigger>
          <TabsTrigger value="net-worth">Net Worth</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Suspense fallback={<div>Loading...</div>}>
              <FinancialHealthScore />
            </Suspense>

            <Suspense fallback={<div>Loading...</div>}>
              <RadarChart />
            </Suspense>

            <Suspense fallback={<div>Loading...</div>}>
              <NetWorthTimeline />
            </Suspense>

            <Suspense fallback={<div>Loading...</div>}>
              <SankeyDiagram />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="income-expense" className="mt-6">
          <WidgetLayout title="Income vs Expenses Analysis">
            <div className="p-4 text-center text-muted-foreground">
              Detailed income and expense analysis will be displayed here
            </div>
          </WidgetLayout>
        </TabsContent>

        <TabsContent value="net-worth" className="mt-6">
          <WidgetLayout title="Net Worth Analysis">
            <div className="p-4 text-center text-muted-foreground">
              Detailed net worth analysis will be displayed here
            </div>
          </WidgetLayout>
        </TabsContent>

        <TabsContent value="investments" className="mt-6">
          <WidgetLayout title="Investment Performance">
            <div className="p-4 text-center text-muted-foreground">
              Detailed investment performance analysis will be displayed here
            </div>
          </WidgetLayout>
        </TabsContent>
      </Tabs>
    </div>
  )
}

