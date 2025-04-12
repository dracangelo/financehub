import type { Metadata } from "next"
import { getPortfolioAllocation, getRebalancingRecommendations } from "@/app/actions/investments"
import { AssetAllocationChart } from "@/components/investments/asset-allocation-chart"
import { RebalancingRecommendations } from "@/components/investments/rebalancing-recommendations"
import { TargetAllocationForm } from "@/components/investments/target-allocation-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Asset Allocation Optimizer",
  description: "Optimize your investment portfolio allocation and get rebalancing recommendations",
}

export default async function AssetAllocationPage() {
  const portfolioAllocation = await getPortfolioAllocation()
  const rebalancingRecommendations = await getRebalancingRecommendations()

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
            <div className="text-3xl font-bold">${portfolioAllocation.totalPortfolioValue.toFixed(2)}</div>
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
                <AssetAllocationChart data={portfolioAllocation.allocationByType} valueKey="value" nameKey="type" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation by Account</CardTitle>
                <CardDescription>Distribution of your investments by account</CardDescription>
              </CardHeader>
              <CardContent>
                <AssetAllocationChart data={portfolioAllocation.allocationByAccount} valueKey="value" nameKey="name" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation by Risk</CardTitle>
                <CardDescription>Distribution of your investments by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                <AssetAllocationChart data={portfolioAllocation.allocationByRisk} valueKey="value" nameKey="risk" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current vs Target Allocation</CardTitle>
                <CardDescription>Comparison of your current allocation to your targets</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="targets" className="mt-4">
          <TargetAllocationForm
            currentTargets={rebalancingRecommendations.targetAllocation}
            currentAllocation={rebalancingRecommendations.currentAllocation}
          />
        </TabsContent>
        <TabsContent value="rebalancing" className="mt-4">
          <RebalancingRecommendations
            recommendations={rebalancingRecommendations}
            portfolioValue={portfolioAllocation.totalPortfolioValue}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

