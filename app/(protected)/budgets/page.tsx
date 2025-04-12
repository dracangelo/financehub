import { Suspense } from "react"
import { getBudgets } from "@/app/actions"
import { getCategories, ensureStaticCategories } from "@/app/actions/categories"
import { BudgetDashboard } from "@/components/budgets/budget-dashboard"
import { BudgetGeneratorWrapper } from "@/components/budgets/budget-generator-wrapper"
import { BudgetGoalsWrapper } from "@/components/budgets/budget-goals-wrapper"
import { BudgetChat } from "@/components/budgets/shared/budget-chat"
import { BudgetTemplatesWrapper } from "@/components/budgets/templates/budget-templates-wrapper"
import { QuickActionsWrapper } from "@/components/budgets/quick-actions-wrapper"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, LineChart, Target, Sparkles, Users } from "lucide-react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TooltipProvider } from "@/components/ui/tooltip"


export const dynamic = "force-dynamic"

async function BudgetsContent() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="h-[180px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5" />
                AI Insights
              </CardTitle>
              <CardDescription>
                Your budget health score is 85/100
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                Excellent
              </div>
            </CardContent>
          </Card>

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

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Budget Generator
              </CardTitle>
              <CardDescription>
                Create personalized budgets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                <BudgetGeneratorWrapper />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Middle Row - Quick Actions, Templates, Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

          <Card className="h-[400px]">
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <BudgetGoalsWrapper />
            </Suspense>
          </Card>
        </div>

        {/* Bottom Row - Budget Allocation and Discussion */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          <div className="lg:col-span-3">
            <BudgetDashboard
              budgetId={budgets?.[0]?.id || ""}
              categories={categories || []}
              currentMembers={[]}
            />
          </div>
          <div className="lg:col-span-1">
            <Card className="h-[500px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Budget Discussion</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <BudgetChat budgetId={budgets?.[0]?.id || ""} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in BudgetsContent:", error)
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
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground text-lg">Manage your spending budgets</p>
        </div>

        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <BudgetsContent />
        </Suspense>
      </div>
    </TooltipProvider>
  )
}

