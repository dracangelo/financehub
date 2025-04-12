"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { BudgetPieChart } from "@/components/budgeting/budget-pie-chart"

interface BudgetModel {
  id: string
  name: string
  description: string
  bestFor: string
  pros: string[]
  cons: string[]
  allocation: {
    category: string
    percentage: number
  }[]
}

interface BudgetModelDetailsProps {
  model: BudgetModel
  monthlyIncome: number
}

export function BudgetModelDetails({ model, monthlyIncome }: BudgetModelDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Convert allocation to format expected by BudgetPieChart
  const categories = model.allocation.map((item) => ({
    name: item.category,
    amount: (monthlyIncome * item.percentage) / 100,
    percentage: item.percentage,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{model.name}</h2>
        <p className="text-muted-foreground">{model.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
            <CardDescription>How your {formatCurrency(monthlyIncome)} would be allocated</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <BudgetPieChart categories={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Overview</CardTitle>
            <CardDescription>Key information about the {model.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="font-medium mb-1">Best For</p>
              <p className="text-sm text-muted-foreground">{model.bestFor}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-medium mb-2">Pros</p>
                <ul className="space-y-2">
                  {model.pros.map((pro, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-medium mb-2">Cons</p>
                <ul className="space-y-2">
                  {model.cons.map((con, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Allocation</CardTitle>
          <CardDescription>Breakdown of how your income would be allocated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {model.allocation.map((item) => (
              <div key={item.category} className="space-y-1">
                <p className="font-medium">{item.category}</p>
                <p className="text-2xl">{formatCurrency((monthlyIncome * item.percentage) / 100)}</p>
                <p className="text-sm text-muted-foreground">{item.percentage}% of income</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button size="lg">Apply This Budget Model</Button>
      </div>
    </div>
  )
}

