import type { Metadata } from "next"
import { getPortfolioAllocation, getRebalancingRecommendations } from "@/app/actions/investments"
import { AssetAllocationChart } from "@/components/investments/asset-allocation-chart"
import { RebalancingRecommendations } from "@/components/investments/rebalancing-recommendations"
import { TargetAllocationForm } from "@/components/investments/target-allocation-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Asset Allocation Optimizer",
  description: "Optimize your investment portfolio allocation and get rebalancing recommendations",
}

export default async function AssetAllocationPage() {
  const portfolioAllocation = await getPortfolioAllocation()
  const rebalancingRecommendations = await getRebalancingRecommendations()

  // Handle empty data case
  if (!portfolioAllocation.allocationByType || portfolioAllocation.allocationByType.length === 0) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Asset Allocation Optimizer</h1>
          <p className="text-muted-foreground">
            Optimize your investment portfolio allocation and get rebalancing recommendations
          </p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Investment Data Found</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Add investments to your portfolio to see allocation analysis and rebalancing recommendations.
            </p>
            <Button asChild>
              <a href="/investments">Manage Investments</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Asset Allocation Optimizer</h1>
        <p className="text-muted-foreground">
          Optimize your investment portfolio allocation and get rebalancing recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Portfolio Value</CardTitle>
            <CardDescription>Current market value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${portfolioAllocation.totalPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Allocation Drift</CardTitle>
            <CardDescription>Deviation from targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                rebalancingRecommendations.totalDifference > 10
                  ? "text-red-500"
                  : rebalancingRecommendations.totalDifference > 5
                    ? "text-amber-500"
                    : "text-green-500"
              }`}
            >
              {rebalancingRecommendations.totalDifference.toFixed(2)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {rebalancingRecommendations.totalDifference <= 3 
                ? "Your portfolio is well-balanced" 
                : rebalancingRecommendations.totalDifference <= 7 
                ? "Minor rebalancing may be needed" 
                : "Significant rebalancing recommended"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Rebalancing Status</CardTitle>
            <CardDescription>Based on your targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold ${
                rebalancingRecommendations.needsRebalancing ? "text-amber-500" : "text-green-500"
              }`}
            >
              {rebalancingRecommendations.needsRebalancing ? "Rebalancing Recommended" : "Portfolio Balanced"}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {Object.keys(rebalancingRecommendations.differences).filter(key => 
                Math.abs(rebalancingRecommendations.differences[key].difference) > 5).length} asset classes need adjustment
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">Current Allocation</TabsTrigger>
          <TabsTrigger value="targets">Target Allocation</TabsTrigger>
          <TabsTrigger value="rebalancing">Rebalancing</TabsTrigger>
        </TabsList>
        <TabsContent value="current" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation by Type</CardTitle>
                <CardDescription>Distribution of your investments by asset type</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioAllocation.allocationByType && portfolioAllocation.allocationByType.length > 0 ? (
                  <AssetAllocationChart 
                    data={portfolioAllocation.allocationByType} 
                    valueKey="value" 
                    nameKey="type" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <p>No asset type data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation by Account</CardTitle>
                <CardDescription>Distribution of your investments by account</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioAllocation.allocationByAccount && portfolioAllocation.allocationByAccount.length > 0 ? (
                  <AssetAllocationChart 
                    data={portfolioAllocation.allocationByAccount} 
                    valueKey="value" 
                    nameKey="name" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <p>No account allocation data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation by Risk</CardTitle>
                <CardDescription>Distribution of your investments by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioAllocation.allocationByRisk && portfolioAllocation.allocationByRisk.length > 0 ? (
                  <AssetAllocationChart 
                    data={portfolioAllocation.allocationByRisk} 
                    valueKey="value" 
                    nameKey="risk" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <p>No risk allocation data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current vs Target Allocation</CardTitle>
                <CardDescription>Comparison of your current allocation to your targets</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {rebalancingRecommendations.differences && Object.keys(rebalancingRecommendations.differences).length > 0 ? (
                  <AssetAllocationChart
                    data={Object.entries(rebalancingRecommendations.differences).map(([type, data]) => ({
                      name: type,
                      current: data.current,
                      target: data.target,
                      difference: data.difference,
                    }))}
                    type="bar"
                    compareKeys={["current", "target"]}
                    nameKey="name"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <p>No target allocation data available</p>
                    <p className="text-sm mt-2">Set target allocations in the Target Allocation tab</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="targets" className="mt-4">
          {rebalancingRecommendations.currentAllocation && Object.keys(rebalancingRecommendations.currentAllocation).length > 0 ? (
            <TargetAllocationForm
              currentTargets={rebalancingRecommendations.targetAllocation}
              currentAllocation={rebalancingRecommendations.currentAllocation}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Allocation Data Available</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Add investments to your portfolio to set target allocations and optimize your portfolio.
                </p>
                <Button asChild>
                  <a href="/investments">Manage Investments</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="rebalancing" className="mt-4">
          {rebalancingRecommendations.differences && Object.keys(rebalancingRecommendations.differences).length > 0 ? (
            <RebalancingRecommendations
              recommendations={rebalancingRecommendations}
              portfolioValue={portfolioAllocation.totalPortfolioValue}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Rebalancing Needed</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Set target allocations in the Target Allocation tab to see rebalancing recommendations.
                </p>
                <Button variant="outline" asChild>
                  <a href="#" onClick={() => document.querySelector('[value="targets"]')?.dispatchEvent(new MouseEvent('click'))}>
                    Set Target Allocations
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

