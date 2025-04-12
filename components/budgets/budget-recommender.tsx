"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { generateBudgetRecommendation } from "@/app/actions/budget-recommendations"
import { formatCurrency } from "@/lib/utils"

interface BudgetRecommendation {
  model_type: "traditional" | "zero-based" | "50-30-20" | "envelope"
  total_budget: number
  categories: {
    id: string
    name: string
    recommended_amount: number
    confidence_score: number
    reasoning: string
  }[]
  savings_target: number
  risk_level: "low" | "medium" | "high"
  adjustments: string[]
}

const BUDGET_MODELS = [
  {
    id: "traditional",
    name: "Traditional",
    description: "Based on historical spending patterns with suggested optimizations"
  },
  {
    id: "zero-based",
    name: "Zero-Based",
    description: "Every dollar is assigned a purpose, starting from zero"
  },
  {
    id: "50-30-20",
    name: "50/30/20 Rule",
    description: "50% needs, 30% wants, 20% savings"
  },
  {
    id: "envelope",
    name: "Envelope System",
    description: "Separate envelopes for different spending categories"
  }
] as const

export function BudgetRecommenderClient({ userId }: { userId: string }) {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)
  const [selectedModel, setSelectedModel] = useState<typeof BUDGET_MODELS[number]["id"]>("traditional")
  const [isLoading, setIsLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<Awaited<ReturnType<typeof generateBudgetRecommendation>> | null>(null)

  const handleGenerateRecommendation = async () => {
    if (!monthlyIncome) return

    setIsLoading(true)
    try {
      const result = await generateBudgetRecommendation(
        userId,
        monthlyIncome,
        selectedModel
      )
      setRecommendation(result)
    } catch (error) {
      console.error("Error generating budget recommendation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Budget Generator</h3>
        
        <div className="grid gap-4 mb-6">
          <div className="grid gap-2">
            <Label htmlFor="monthly-income">Monthly Income</Label>
            <Input
              id="monthly-income"
              type="number"
              placeholder="0.00"
              value={monthlyIncome || ""}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="budget-model">Budget Model</Label>
            <Select
              value={selectedModel}
              onValueChange={(value: typeof selectedModel) => setSelectedModel(value)}
            >
              <SelectTrigger id="budget-model">
                <SelectValue placeholder="Select a budget model" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">{model.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateRecommendation}
            disabled={!monthlyIncome || isLoading}
          >
            {isLoading ? "Generating..." : "Generate Recommendation"}
          </Button>
        </div>

        {recommendation && (
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Total Budget</h4>
                <p className="text-2xl font-bold">{formatCurrency(recommendation.total_budget)}</p>
              </Card>
              
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Savings Target</h4>
                <p className="text-2xl font-bold">{formatCurrency(recommendation.savings_target)}</p>
              </Card>
              
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Model Type</h4>
                <p className="text-2xl font-bold capitalize">{recommendation.model_type}</p>
              </Card>
              
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Risk Level</h4>
                <p className={`text-2xl font-bold capitalize
                  ${recommendation.risk_level === "low" ? "text-green-500" :
                    recommendation.risk_level === "medium" ? "text-yellow-500" :
                    "text-red-500"
                  }`}
                >
                  {recommendation.risk_level}
                </p>
              </Card>
            </div>

            {recommendation.adjustments.length > 0 && (
              <Alert variant={recommendation.risk_level === "high" ? "destructive" : "default"}>
                <AlertTitle>Recommendations</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1">
                    {recommendation.adjustments.map((adjustment, i) => (
                      <li key={i}>{adjustment}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Recommended Amount</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Reasoning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendation.categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{formatCurrency(category.recommended_amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${category.confidence_score * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(category.confidence_score * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.reasoning}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
