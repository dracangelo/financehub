import { getRecentTransactions, getMonthlyIncomeExpenseData, getTransactionStats } from "@/app/actions/transactions"
import { getAccountSummary } from "@/app/actions/accounts"
import { getCategorySpending } from "@/app/actions/categories"
import { getCashflowForecast } from "@/lib/cashflow-utils"
import { requireAuth } from "@/lib/auth"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardCards } from "@/components/dashboard/dashboard-cards"
import { FinancialHealthScore } from "@/components/dashboard/financial-health-score"
import { FinancialAssistant } from "@/components/dashboard/financial-assistant"
import { TimeBasedFilters } from "@/components/dashboard/time-based-filters"
import { FinancialCalendar } from "@/components/dashboard/financial-calendar"
import { SankeyDiagram } from "@/components/dashboard/sankey-diagram"
import { RadarChart } from "@/components/dashboard/radar-chart"
import { NetWorthTimeline } from "@/components/dashboard/net-worth-timeline"
import { CashFlowForecast } from "@/components/dashboard/cash-flow-forecast"
import { WidgetLayout } from "@/components/dashboard/widget-layout"
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart" // Import IncomeExpenseChart

// We'll use real data from the database instead of sample data

export const metadata = {
  title: "Dashboard",
  description: "View your financial overview",
}

export default async function DashboardPage() {
  try {
    // This will redirect to login if not authenticated
    const user = await requireAuth()

    // Fetch data for the dashboard
    const [recentTransactions, accountSummary, categorySpending, incomeExpenseData, transactionStats, cashflowForecast] = await Promise.all([
      getRecentTransactions(5).catch(() => []),
      getAccountSummary().catch(() => ({
        totalBalance: 0,
        accountCount: 0,
        currencyBreakdown: {},
        typeBreakdown: {},
      })),
      getCategorySpending("month").catch(() => []),
      getMonthlyIncomeExpenseData().catch(() => []),
      getTransactionStats("month").catch(() => ({
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        transactionCount: 0,
        averageTransaction: 0,
      })),
      getCashflowForecast(user.id).catch(() => ({
        projectedIncome: 0,
        projectedExpenses: 0,
        netCashflow: 0,
        savingsRate: 0,
        monthlyTrend: [],
        monthOverMonth: { income: 0, expenses: 0 }
      })),
    ])

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your financial overview and insights</p>
          </div>
          <TimeBasedFilters />
        </div>
        <WidgetLayout title="Financial Overview">
          <DashboardCards 
            accountSummary={accountSummary}
            cashflowSummary={cashflowForecast}
          />
          <FinancialHealthScore />
          <FinancialAssistant />
          <FinancialCalendar />
          <SankeyDiagram />
          <RadarChart />
          <NetWorthTimeline />
          <CashFlowForecast data={cashflowForecast.monthlyTrend} />
        </WidgetLayout>
        <IncomeExpenseChart 
          data={incomeExpenseData} 
          totalIncome={transactionStats.totalIncome} 
          totalExpenses={transactionStats.totalExpenses} 
        /> {/* Income vs Expense Chart with totals */}
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    return (
      <DashboardShell>
        <DashboardHeader heading="Dashboard" text="Your financial overview" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Error loading dashboard</h2>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
        </div>
      </DashboardShell>
    )
  }
}

