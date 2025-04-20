import { Suspense } from "react"
import { getBudgets } from "@/app/actions/budgets"
import { getCategories, ensureStaticCategories } from "@/app/actions/categories"
import { BudgetDashboard } from "@/components/budgets/budget-dashboard"
import { BudgetList } from "@/components/budgets/budget-list"
import { QuickActionsWrapper } from "@/components/budgets/quick-actions-wrapper"
import { BudgetTemplatesWrapper } from "@/components/budgets/templates/budget-templates-wrapper"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Target, Plus, List, Grid3X3 } from "lucide-react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils/formatting"

export const dynamic = "force-dynamic"

async function BudgetsList() {
  try {
    // Get budgets
    const budgets = await getBudgets()
    
    if (!budgets || budgets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-[400px]">
          <div className="mb-4 p-4 rounded-full bg-muted">
            <LineChart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Budgets Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first budget to start tracking your spending and saving goals.
          </p>
          <Button asChild>
            <Link href="/budgets/manage/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Budget
            </Link>
          </Button>
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        {/* Budget List with Edit and Delete functionality */}
        <BudgetList budgets={budgets} />
        
        {/* Create New Budget Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/budgets/manage/create">
            <Card className="h-full border-dashed hover:border-primary transition-colors cursor-pointer flex flex-col justify-center items-center p-6">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create New Budget</h3>
              <p className="text-muted-foreground text-center">
                Set up a new budget to track your finances
              </p>
            </Card>
          </Link>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in BudgetsList:", error)
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 text-destructive">
        <h2 className="text-lg font-semibold">Error loading budgets</h2>
        <p>There was a problem loading your budgets. Please try refreshing the page.</p>
      </div>
    )
  }
}

async function BudgetsAdvanced() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error("Not authenticated")
    }

    // Get categories first, which will be initialized if needed
    const { categories } = await ensureStaticCategories()

    // Get budgets after categories are ensured
    const budgets = await getBudgets()
    
    // Check if we have any budgets
    const hasBudgets = budgets && budgets.length > 0
    
    // Calculate total budget allocation across all budgets
    const totalBudgeted = hasBudgets
      ? budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0)
      : 0
    
    // Calculate total allocated across all budgets
    const totalAllocated = hasBudgets
      ? budgets.reduce((sum, budget) => {
          const budgetAllocated = budget.budget_categories?.reduce(
            (catSum, cat) => catSum + (cat.amount_allocated || 0),
            0
          ) || 0
          return sum + budgetAllocated
        }, 0)
      : 0
    
    // Calculate overall allocation percentage
    const overallAllocationPercentage = totalBudgeted > 0
      ? (totalAllocated / totalBudgeted) * 100
      : 0
    
    // Get the most recent budget for default display
    const defaultBudgetId = hasBudgets ? budgets[0].id : ""

    return (
      <div className="space-y-6">
        {/* Top Row - Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="h-[180px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChart className="h-5 w-5" />
                Budget Overview
              </CardTitle>
              <CardDescription>
                Total Allocation Across All Budgets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Budgeted: {formatCurrency(totalBudgeted)}</span>
                  <span>Allocated: {formatCurrency(totalAllocated)}</span>
                </div>
                <Progress 
                  value={overallAllocationPercentage} 
                  className="h-2" 
                />
                <p className="text-sm text-muted-foreground">
                  {overallAllocationPercentage.toFixed(1)}% of total budget allocated
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[180px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                Budget Summary
              </CardTitle>
              <CardDescription>
                Active Budgets: {hasBudgets ? budgets.length : 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasBudgets ? (
                <div className="space-y-2">
                  <div className="text-lg font-medium">
                    Most Recent: {budgets[0].name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/budgets/${budgets[0].id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/budgets/manage/create">
                        Create New Budget
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-muted-foreground mb-2">No budgets created yet</p>
                  <Button asChild size="sm">
                    <Link href="/budgets/manage/create">
                      Create Your First Budget
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Row - Quick Actions and Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <QuickActionsWrapper />
            </CardContent>
          </Card>

          <Card className="h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Budget Templates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <BudgetTemplatesWrapper />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Budget Allocation */}
        {hasBudgets ? (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Budget Allocation</h3>
                {budgets.length > 1 && (
                  <Select defaultValue={defaultBudgetId}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a budget" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets.map((budget) => (
                        <SelectItem key={budget.id} value={budget.id}>
                          {budget.name} ({formatCurrency(budget.amount)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <BudgetDashboard
                budgetId={defaultBudgetId}
                categories={categories || []}
                currentMembers={[]}
              />
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Target className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Budget Data Available</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create your first budget to see detailed allocation visualizations and insights.
              </p>
              <Button asChild>
                <Link href="/budgets/manage/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Budget
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error in BudgetsAdvanced:", error)
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 text-destructive">
        <h2 className="text-lg font-semibold">Error loading budgets</h2>
        <p>There was a problem loading your budgets. Please try refreshing the page.</p>
      </div>
    )
  }
}

export default function BudgetsPage() {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-[1800px] mx-auto w-full">
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground text-lg">Manage your spending budgets</p>
          </div>
          <Button asChild>
            <Link href="/budgets/manage/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="essentials" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="essentials" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Budget List
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Advanced Features
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="essentials" className="mt-0">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <BudgetsList />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="advanced" className="mt-0">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <BudgetsAdvanced />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
