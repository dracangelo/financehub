"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type Investment,
  type AssetClass,
  calculateCurrentAllocation,
  calculatePerformance,
  calculateTaxEfficiency,
  sampleInvestments,
  defaultAssetClasses,
  formatCurrency,
} from "@/lib/investments/calculations"
import { PortfolioAllocationChart } from "@/components/investments/portfolio-allocation-chart"
import { PortfolioSummaryMetrics } from "@/components/investments/portfolio-summary-metrics"
import { PortfolioInvestmentTable } from "@/components/investments/portfolio-investment-table"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function PortfolioContent() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Investment Portfolio</h2>
      <p className="text-muted-foreground">
        Track and manage your investment portfolio here. This page is under development.
      </p>
    </div>
  )
}

export default function PortfolioOverviewPage() {
  const [investments, setInvestments] = useState<Investment[]>(sampleInvestments)
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>(defaultAssetClasses)
  const [activeTab, setActiveTab] = useState<string>("overview")

  // Calculate current allocation
  const currentAssetClasses = calculateCurrentAllocation(investments, assetClasses)

  // Calculate performance metrics
  const performanceMetrics = calculatePerformance(investments)

  // Calculate tax efficiency
  const taxEfficiency = calculateTaxEfficiency(investments)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
          <p className="text-muted-foreground mt-2">Comprehensive view of your investment portfolio</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/investments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Investments
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
            <CardDescription>Current asset allocation of your portfolio</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <PortfolioAllocationChart assetClasses={currentAssetClasses} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
            <CardDescription>Key metrics for your investment portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioSummaryMetrics performanceMetrics={performanceMetrics} taxEfficiency={taxEfficiency} />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">All Investments</TabsTrigger>
          <TabsTrigger value="asset-classes">By Asset Class</TabsTrigger>
          <TabsTrigger value="accounts">By Account</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Investment Portfolio</CardTitle>
                  <CardDescription>All your investment holdings</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Investment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PortfolioInvestmentTable investments={investments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asset-classes" className="space-y-4">
          {currentAssetClasses.map((assetClass) => (
            <Card key={assetClass.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{assetClass.name}</CardTitle>
                    <CardDescription>
                      {formatCurrency(assetClass.investments.reduce((sum, inv) => sum + inv.value, 0))}(
                      {assetClass.currentAllocation.toFixed(1)}% of portfolio)
                    </CardDescription>
                  </div>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add to {assetClass.name}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PortfolioInvestmentTable investments={assetClass.investments} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          {/* Group investments by tax location */}
          {["taxable", "tax_deferred", "tax_free"].map((taxLocation) => {
            const accountInvestments = investments.filter((inv) => inv.taxLocation === taxLocation)
            const accountValue = accountInvestments.reduce((sum, inv) => sum + inv.value, 0)

            if (accountInvestments.length === 0) return null

            const accountName =
              taxLocation === "taxable"
                ? "Taxable Accounts"
                : taxLocation === "tax_deferred"
                  ? "Tax-Deferred Accounts"
                  : "Tax-Free Accounts"

            return (
              <Card key={taxLocation}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{accountName}</CardTitle>
                      <CardDescription>
                        {formatCurrency(accountValue)}(
                        {((accountValue / performanceMetrics.totalValue) * 100).toFixed(1)}% of portfolio)
                      </CardDescription>
                    </div>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add to {accountName}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <PortfolioInvestmentTable investments={accountInvestments} />
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}

