"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

interface BudgetModelComparisonProps {
  models: BudgetModel[]
  monthlyIncome: number
  onSelectModel: (modelId: string) => void
}

export function BudgetModelComparison({ models, monthlyIncome, onSelectModel }: BudgetModelComparisonProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {models.map((model) => (
        <Card key={model.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{model.name}</CardTitle>
            <CardDescription>{model.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div>
              <p className="text-sm font-medium">Best for:</p>
              <p className="text-sm text-muted-foreground">{model.bestFor}</p>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <p className="text-sm font-medium">Pros:</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">Advantages of this budgeting model</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {model.pros.slice(0, 2).map((pro, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Sample Allocation:</p>
              <div className="space-y-1.5">
                {model.allocation.slice(0, 3).map((item) => (
                  <div key={item.category} className="flex justify-between items-center">
                    <p className="text-xs">{item.category}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.percentage}%
                      </Badge>
                      <p className="text-xs font-medium">{formatCurrency((monthlyIncome * item.percentage) / 100)}</p>
                    </div>
                  </div>
                ))}
                {model.allocation.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{model.allocation.length - 3} more categories
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => onSelectModel(model.id)} className="w-full">
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

