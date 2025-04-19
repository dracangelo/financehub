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

    return (
      <div className="space-y-6">
        {/* Top Row - Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="h-[180px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChart className="h-5 w-5" />
                Monthly Overview
              </CardTitle>
              <CardDescription>
                Spending vs Budget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                Under Budget
              </div>
            </CardContent>
          </Card>

          <Card className="h-[180px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                Budget Insights
              </CardTitle>
              <CardDescription>
                Key metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                2 categories over budget
              </div>
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
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <div>
            <BudgetDashboard
              budgetId={budgets?.[0]?.id || ""}
              categories={categories || []}
              currentMembers={[]}
            />
          </div>
        </div>
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
