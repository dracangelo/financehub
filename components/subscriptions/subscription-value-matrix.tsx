"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

interface Subscription {
  id: string
  name: string
  provider: string
  monthlyAmount: number
  usageScore: number
  usageHours: number
  costPerUse: number
  costPerHour: number
  roiScore: number
  valueCategory: "poor" | "average" | "good"
  recommendation: string
}

interface SubscriptionValueMatrixProps {
  subscriptions: Subscription[]
}

export function SubscriptionValueMatrix({ subscriptions }: SubscriptionValueMatrixProps) {
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)

  // Define the matrix dimensions
  const usageLabels = ["Low", "Medium", "High"]
  const costLabels = ["High", "Medium", "Low"]

  // Helper function to determine the usage category
  const getUsageCategory = (usageScore: number): number => {
    if (usageScore < 4) return 0 // Low
    if (usageScore < 7) return 1 // Medium
    return 2 // High
  }

  // Helper function to determine the cost category (inverted scale)
  const getCostCategory = (monthlyAmount: number): number => {
    // Find the quartiles of monthly amounts
    const sortedAmounts = [...subscriptions].sort((a, b) => a.monthlyAmount - b.monthlyAmount)
    const q1Index = Math.floor(sortedAmounts.length / 4)
    const q3Index = Math.floor((3 * sortedAmounts.length) / 4)

    const q1 = sortedAmounts[q1Index]?.monthlyAmount || 0
    const q3 = sortedAmounts[q3Index]?.monthlyAmount || 100

    if (monthlyAmount > q3) return 0 // High cost
    if (monthlyAmount > q1) return 1 // Medium cost
    return 2 // Low cost
  }

  // Group subscriptions into the matrix
  const matrix = Array(3)
    .fill(null)
    .map(() => Array(3).fill([]))

  subscriptions.forEach((sub) => {
    const usageCategory = getUsageCategory(sub.usageScore)
    const costCategory = getCostCategory(sub.monthlyAmount)

    // Create a new array at this position if it doesn't exist
    if (!matrix[costCategory][usageCategory].length) {
      matrix[costCategory][usageCategory] = []
    }

    // Add the subscription to the matrix
    matrix[costCategory][usageCategory] = [...matrix[costCategory][usageCategory], sub]
  })

  // Get color for a cell based on its position
  const getCellColor = (costIndex: number, usageIndex: number) => {
    // Bottom right (high usage, low cost) is best
    if (costIndex === 2 && usageIndex === 2) return "bg-green-100 border-green-300"
    // Top left (low usage, high cost) is worst
    if (costIndex === 0 && usageIndex === 0) return "bg-red-100 border-red-300"
    // Diagonal from top-right to bottom-left is medium
    if (costIndex === usageIndex) return "bg-yellow-100 border-yellow-300"
    // Others based on position
    if (costIndex > usageIndex) return "bg-yellow-50 border-yellow-200"
    return "bg-orange-50 border-orange-200"
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Subscription Value Matrix</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <InfoIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  This matrix plots your subscriptions based on usage and cost. The best value subscriptions (high
                  usage, low cost) appear in the bottom right. The worst value (low usage, high cost) appear in the top
                  left.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Top left empty cell */}
          <div className="flex items-center justify-center font-medium">
            Usage →<br />
            Cost ↓
          </div>

          {/* Usage labels (top row) */}
          {usageLabels.map((label, index) => (
            <div key={`usage-${index}`} className="flex items-center justify-center font-medium">
              {label}
            </div>
          ))}

          {/* Generate the matrix */}
          {costLabels.map((costLabel, costIndex) => (
            <>
              {/* Cost label (first column) */}
              <div key={`cost-${costIndex}`} className="flex items-center justify-center font-medium">
                {costLabel}
              </div>

              {/* Matrix cells */}
              {[0, 1, 2].map((usageIndex) => (
                <div
                  key={`cell-${costIndex}-${usageIndex}`}
                  className={`border rounded-lg p-2 min-h-24 ${getCellColor(costIndex, usageIndex)}`}
                >
                  {matrix[costIndex][usageIndex].length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {matrix[costIndex][usageIndex].map((sub) => (
                        <Badge
                          key={sub.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => setSelectedSubscription(sub)}
                        >
                          {sub.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground h-full flex items-center justify-center">
                      No subscriptions
                    </div>
                  )}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>

      {selectedSubscription && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{selectedSubscription.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedSubscription.provider}</p>
              </div>
              <Badge
                className={
                  selectedSubscription.valueCategory === "good"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : selectedSubscription.valueCategory === "average"
                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      : "bg-red-100 text-red-800 hover:bg-red-100"
                }
              >
                {selectedSubscription.valueCategory.charAt(0).toUpperCase() +
                  selectedSubscription.valueCategory.slice(1)}{" "}
                Value
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-lg font-medium">${selectedSubscription.monthlyAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usage Score</p>
                <p className="text-lg font-medium">{selectedSubscription.usageScore.toFixed(1)}/10</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost Per Use</p>
                <p className="text-lg font-medium">${selectedSubscription.costPerUse.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost Per Hour</p>
                <p className="text-lg font-medium">${selectedSubscription.costPerHour.toFixed(2)}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground">ROI Score</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div
                  className={`h-2.5 rounded-full ${
                    selectedSubscription.roiScore >= 70
                      ? "bg-green-500"
                      : selectedSubscription.roiScore >= 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${selectedSubscription.roiScore}%` }}
                ></div>
              </div>
              <p className="text-right text-xs text-muted-foreground mt-1">
                {selectedSubscription.roiScore.toFixed(0)}/100
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Recommendation:</p>
              <p className="text-sm text-muted-foreground">{selectedSubscription.recommendation}</p>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedSubscription(null)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

