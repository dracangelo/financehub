"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BudgetTemplateCard } from "./templates/budget-template-card"
import { InteractiveTreemap } from "./visualizations/interactive-treemap"
import { InteractiveWaterfall } from "./visualizations/interactive-waterfall"
import { BudgetProgressTracker } from "./progress/budget-progress-tracker"
import { BudgetSharingDialog } from "./shared/budget-sharing-dialog"
import { LIFE_EVENT_TEMPLATES } from "@/lib/budget/templates/life-events"
import { LIFESTYLE_TEMPLATES } from "@/lib/budget/templates/lifestyle"
import { AlertCircle, BarChart3, LineChart, PieChart, Share2, Target } from "lucide-react"
import { getBudgetById } from "@/app/actions/budgets"
import { formatCurrency } from "@/lib/utils/formatting"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BudgetDashboardProps {
  budgetId: string
  categories: any[]
  currentMembers: any[]
}

export function BudgetDashboard({ budgetId, categories, currentMembers }: BudgetDashboardProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [budget, setBudget] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBudgetData() {
      if (!budgetId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const budgetData = await getBudgetById(budgetId)
        setBudget(budgetData)
      } catch (err) {
        console.error("Error loading budget data:", err)
        setError("Failed to load budget data")
      } finally {
        setLoading(false)
      }
    }

    loadBudgetData()
  }, [budgetId])

  // Calculate budget metrics
  const totalAllocated = budget?.budget_categories?.reduce(
    (sum: number, category: any) => sum + category.amount_allocated, 
    0
  ) || 0
  
  const remainingBudget = (budget?.income || 0) - totalAllocated
  const allocationPercentage = budget?.income ? (totalAllocated / budget.income) * 100 : 0
  
  // Use categories from budget creation for visualizations
  // First check if we have budget categories, if not use the provided categories prop
  const budgetHasCategories = budget?.budget_categories && budget.budget_categories.length > 0
  
  // Prepare data for visualizations
  const categoryData = budgetHasCategories ? 
    // Use categories from the budget if available
    budget.budget_categories.map((category: any) => ({
      id: category.id,
      name: category.name || "Unnamed Category",
      amount: category.amount_allocated,
      percentage: (category.amount_allocated / (budget?.income || 1)) * 100,
      color: getCategoryColor(category.amount_allocated, budget?.income || 1),
    })) : 
    // Otherwise use the provided categories prop
    categories.map((category: any) => ({
      id: category.id,
      name: category.name || "Unnamed Category",
      amount: category.amount || 0,
      percentage: (category.amount || 0) / (budget?.income || 1) * 100,
      color: getCategoryColor(category.amount || 0, budget?.income || 1),
    }))

  // Format data for the treemap
  const treemapData = {
    categories: categoryData,
    totalBudget: budget?.income || 0
  }

  // Format data for the waterfall chart
  const waterfallData = categoryData.map((cat: any) => ({
    category: cat.name,
    budgeted: cat.amount,
    actual: cat.amount, // In a real app, you'd use actual spending data here
    variance: 0 // In a real app, you'd calculate this from actual data
  }))

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading budget data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !budget) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || "Could not load budget data. Please try again later."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if ((!budget.budget_categories || budget.budget_categories.length === 0) && (!categories || categories.length === 0)) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-medium mb-2">No Categories Allocated</h3>
            <p className="text-muted-foreground mb-6">
              You haven't allocated any categories to this budget yet.
              Add categories to visualize your budget allocation.
            </p>
            <Button asChild>
              <a href={`/budgets/${budgetId}`}>Manage Budget Categories</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Budget Allocation</CardTitle>
            <p className="text-muted-foreground mt-1">
              Total Budget: {formatCurrency(budget.income)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BudgetSharingDialog budgetId={budgetId} currentMembers={currentMembers} />
            <Button variant="outline" size="sm" asChild>
              <a href={`/budgets/${budgetId}`}>
                <Target className="h-4 w-4 mr-2" />
                Manage Categories
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Budget Progress Summary */}
      <div className="px-6 pb-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Allocated: {formatCurrency(totalAllocated)}</span>
            <span>Remaining: {formatCurrency(remainingBudget)}</span>
          </div>
          <Progress value={allocationPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {allocationPercentage.toFixed(1)}% of budget allocated
          </p>
        </div>
      </div>
      
      <CardContent className="p-0">
        <Tabs defaultValue="treemap" className="h-full">
          <TabsList className="px-6 mb-4">
            <TabsTrigger value="treemap" className="flex items-center gap-1">
              <PieChart className="h-4 w-4" />
              Treemap
            </TabsTrigger>
            <TabsTrigger value="waterfall" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Waterfall
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-1">
              <LineChart className="h-4 w-4" />
              Category Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="treemap" className="mt-0">
            <div className="px-6 pb-6">
              <InteractiveTreemap budget={treemapData} />
            </div>
          </TabsContent>

          <TabsContent value="waterfall" className="mt-0">
            <div className="px-6 pb-6">
              <InteractiveWaterfall data={waterfallData} />
            </div>
          </TabsContent>

          <TabsContent value="table" className="mt-0">
            <div className="px-6 pb-6">
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Category</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="text-right p-3">% of Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.budget_categories.map((category: any) => (
                      <tr key={category.id} className="border-b">
                        <td className="p-3">{category.name}</td>
                        <td className="text-right p-3">{formatCurrency(category.amount_allocated)}</td>
                        <td className="text-right p-3">
                          {((category.amount_allocated / budget.income) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    <tr className="font-medium bg-muted/30">
                      <td className="p-3">Total</td>
                      <td className="text-right p-3">{formatCurrency(totalAllocated)}</td>
                      <td className="text-right p-3">{allocationPercentage.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Helper function to get category colors based on percentage of budget
function getCategoryColor(amount: number, totalBudget: number): string {
  const percentage = (amount / totalBudget) * 100;
  
  if (percentage > 30) return "#ef4444"; // Red - large allocation
  if (percentage > 20) return "#f97316"; // Orange - medium allocation
  if (percentage > 10) return "#eab308"; // Yellow - moderate allocation
  return "#22c55e"; // Green - small allocation
}
