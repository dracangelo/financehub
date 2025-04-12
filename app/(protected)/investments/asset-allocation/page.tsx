"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type Investment,
  type AssetClass,
  type RiskProfile,
  calculateCurrentAllocation,
  calculateRebalancing,
  calculatePortfolioValue,
  formatCurrency,
  riskProfiles,
  defaultAssetClasses,
  sampleInvestments,
} from "@/lib/investments/calculations"
import { AssetAllocationChart } from "@/components/investments/asset-allocation-chart"
import { RiskProfileSelector } from "@/components/investments/risk-profile-selector"
import { RebalancingTable } from "@/components/investments/rebalancing-table"
import { InvestmentList } from "@/components/investments/investment-list"
import { AssetClassEditor } from "@/components/investments/asset-class-editor"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DemoModeAlert } from "@/components/ui/demo-mode-alert"
import { calculateRebalancingActions } from "@/lib/investments/calculations"

export default function AssetAllocationPage() {
  const [investments, setInvestments] = useState<Investment[]>(sampleInvestments)
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>(defaultAssetClasses)
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<RiskProfile>(riskProfiles[1]) // Moderate by default
  const [activeTab, setActiveTab] = useState<string>("current")

  // Calculate current allocation
  const currentAssetClasses = calculateCurrentAllocation(investments, assetClasses)

  // Calculate rebalancing recommendations
  const rebalancingRecommendations = calculateRebalancing(currentAssetClasses)

  // Calculate total portfolio value
  const totalPortfolioValue = calculatePortfolioValue(investments)

  // Update asset class target allocations based on risk profile
  const handleRiskProfileChange = (profile: RiskProfile) => {
    setSelectedRiskProfile(profile)

    // Update asset class target allocations
    const updatedAssetClasses = [...assetClasses]

    // Map risk profile allocations to asset classes
    updatedAssetClasses.forEach((assetClass) => {
      if (assetClass.name.includes("Stocks") && assetClass.name.includes("US")) {
        assetClass.targetAllocation = profile.recommendedAllocation.stocks * 0.7 // 70% of stocks in US
      } else if (assetClass.name.includes("Stocks") && assetClass.name.includes("International")) {
        assetClass.targetAllocation = profile.recommendedAllocation.stocks * 0.3 // 30% of stocks international
      } else if (assetClass.name.includes("Bonds")) {
        assetClass.targetAllocation = profile.recommendedAllocation.bonds
      } else if (assetClass.name.includes("Cash")) {
        assetClass.targetAllocation = profile.recommendedAllocation.cash
      } else if (assetClass.name.includes("Alternatives")) {
        assetClass.targetAllocation = profile.recommendedAllocation.alternatives
      }
    })

    setAssetClasses(updatedAssetClasses)
  }

  // Update asset class target allocation
  const handleAssetClassUpdate = (updatedAssetClass: AssetClass) => {
    setAssetClasses(assetClasses.map((ac) => (ac.id === updatedAssetClass.id ? updatedAssetClass : ac)))
  }

  const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0)
  const currentAllocation = calculateCurrentAllocation(investments, assetClasses)

  // Merge target allocations from risk profile
  const assetAllocation: AssetClass[] = currentAllocation.map((asset) => ({
    ...asset,
    targetAllocation: selectedRiskProfile.recommendedAllocation[asset.name] || 0,
  }))

  const rebalancingActions = calculateRebalancingActions(
    currentAllocation,
    selectedRiskProfile.recommendedAllocation,
    totalValue,
  )

  return (
    <div className="space-y-6">
      <DemoModeAlert />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Allocation Optimizer</h1>
          <p className="text-muted-foreground mt-2">
            Optimize your portfolio with personalized asset allocation recommendations
          </p>
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
            <CardDescription>Current vs. Target asset allocation</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <AssetAllocationChart assetClasses={currentAssetClasses} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
            <CardDescription>Overview of your investment portfolio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Risk Profile</p>
              <p className="font-medium">{selectedRiskProfile.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedRiskProfile.description}</p>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-2">Expected Annual Return</p>
              <div className="flex items-center">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(selectedRiskProfile.expectedReturn / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 font-medium">{selectedRiskProfile.expectedReturn.toFixed(1)}%</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Expected Risk (Volatility)</p>
              <div className="flex items-center">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${(selectedRiskProfile.expectedRisk / 20) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 font-medium">{selectedRiskProfile.expectedRisk.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Allocation</TabsTrigger>
          <TabsTrigger value="target">Target Allocation</TabsTrigger>
          <TabsTrigger value="rebalance">Rebalancing</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Asset Allocation</CardTitle>
              <CardDescription>Your portfolio's current asset allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentAssetClasses.map((assetClass) => (
                  <div key={assetClass.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{assetClass.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(calculatePortfolioValue(assetClass.investments))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{assetClass.currentAllocation.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">
                          Target: {assetClass.targetAllocation.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${assetClass.currentAllocation}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="target" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Profile</CardTitle>
              <CardDescription>Select a risk profile to get recommended asset allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <RiskProfileSelector
                riskProfiles={riskProfiles}
                selectedProfile={selectedRiskProfile}
                onSelectProfile={handleRiskProfileChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Asset Allocation</CardTitle>
              <CardDescription>Customize your target asset allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <AssetClassEditor assetClasses={assetClasses} onUpdateAssetClass={handleAssetClassUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rebalance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rebalancing Recommendations</CardTitle>
              <CardDescription>Actions to bring your portfolio in line with your target allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <RebalancingTable
                recommendations={rebalancingRecommendations}
                totalPortfolioValue={totalPortfolioValue}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Investments</CardTitle>
              <CardDescription>View and manage your investment holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <InvestmentList investments={investments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

