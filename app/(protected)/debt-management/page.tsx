import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Calculator, TrendingUp, BarChart3, PieChart, Target } from "lucide-react"

import { RepaymentStrategyCalculator } from "@/components/debt/strategic/repayment-strategy-calculator"
import { RefinancingAnalyzer } from "@/components/debt/strategic/refinancing-analyzer"
import { CreditScoreSimulator } from "@/components/debt/strategic/credit-score-simulator"
import { DebtToIncomeTracker } from "@/components/debt/strategic/debt-to-income-tracker"
import { DebtConsolidationAnalyzer } from "@/components/debt/strategic/debt-consolidation-analyzer"
import { LoanComparisonCalculator } from "@/components/debt/strategic/loan-comparison-calculator"
import { DebtTest } from "@/components/debt/debt-test"
import { DebtList } from "@/components/debt/debt-list"

export const dynamic = "force-dynamic"

export default function DebtManagementPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Debt Management"
        text="Take control of your debt with our comprehensive suite of debt management tools."
        icon={<CreditCard className="h-6 w-6" />}
      />

      

      <div className="container py-10 max-w-7xl">
        {/* Display the user's debts */}
        <div className="mb-8">
          <DebtList />
        </div>
        
        <DebtTest />
        <Tabs defaultValue="strategic" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="strategic" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">Strategic</span>
            </TabsTrigger>
            <TabsTrigger value="refinancing" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Refinancing</span>
            </TabsTrigger>
            <TabsTrigger value="credit-score" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden md:inline">Credit Score</span>
            </TabsTrigger>
            <TabsTrigger value="debt-to-income" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden md:inline">Debt-to-Income</span>
            </TabsTrigger>
            <TabsTrigger value="consolidation" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden md:inline">Consolidation</span>
            </TabsTrigger>
            <TabsTrigger value="loan-comparison" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden md:inline">Loan Comparison</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="strategic" className="mt-4">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <RepaymentStrategyCalculator />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="refinancing" className="mt-4">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <RefinancingAnalyzer />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="credit-score" className="mt-4">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <CreditScoreSimulator />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="debt-to-income" className="mt-4">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <DebtToIncomeTracker />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="consolidation" className="mt-4">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <DebtConsolidationAnalyzer />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="loan-comparison" className="mt-4">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <LoanComparisonCalculator />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
