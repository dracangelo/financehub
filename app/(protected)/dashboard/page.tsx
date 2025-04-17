import { getRecentTransactions, getMonthlyIncomeExpenseData, getTransactionStats, getFinancialCalendarData, getCombinedTransactions } from "@/app/actions/transactions"
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
import { NetWorthTimeline } from "@/components/dashboard/net-worth-timeline"
import { CashFlowForecast } from "@/components/dashboard/cash-flow-forecast"
import { WidgetLayout } from "@/components/dashboard/widget-layout"
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart"
import { FinancialInsights } from "@/components/dashboard/financial-insights"
import { FinancialSummary } from "@/components/dashboard/financial-summary"
import { InvestmentAnalyticsWidget } from "@/components/dashboard/investment-analytics-widget"

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
    const [
      recentTransactions, 
      accountSummary, 
      categorySpending, 
      incomeExpenseData, 
      transactionStats, 
      cashflowForecast,
      financialCalendarData,
      combinedTransactions
    ] = await Promise.all([
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
      getFinancialCalendarData().catch(() => []),
      getCombinedTransactions().catch(() => [])
    ])

    // Calculate total income and expenses from combined transactions
    const totalIncome = combinedTransactions
      .filter(transaction => transaction.is_income)
      .reduce((sum, transaction) => sum + transaction.amount, 0)
      
    const totalExpenses = combinedTransactions
      .filter(transaction => !transaction.is_income)
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    // Format category spending data for the financial summary
    const formattedCategorySpending = categorySpending.map(category => ({
      name: category.name || 'Uncategorized',
      amount: category.amount,
      color: category.color
    }))

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your financial overview and insights</p>
          </div>
          <TimeBasedFilters />
        </div>

        {/* Financial Overview Cards */}
        <div className="grid gap-6">
          <DashboardCards 
            accountSummary={accountSummary}
            cashflowSummary={cashflowForecast}
          />
        </div>

        {/* Financial Insights and Calendar */}
        <div className="grid gap-6 md:grid-cols-2">
          <FinancialInsights 
            cashflowSummary={cashflowForecast}
            transactionStats={transactionStats}
          />
          <FinancialCalendar initialData={financialCalendarData} />
        </div>

        {/* Financial Summary */}
        <FinancialSummary 
          accountSummary={accountSummary}
          transactionStats={transactionStats}
          monthlyData={incomeExpenseData}
          categorySpending={formattedCategorySpending}
        />

        {/* Income vs Expense Chart */}
        <IncomeExpenseChart 
          data={incomeExpenseData} 
          totalIncome={totalIncome} 
          totalExpenses={totalExpenses} 
        />

        {/* Additional Visualizations */}
        <div className="grid gap-6 md:grid-cols-2">
          <SankeyDiagram />
          <NetWorthTimeline />
        </div>

        {/* Investment Portfolio Analytics */}
        <InvestmentAnalyticsWidget />

        {/* Cash Flow Forecast */}
        <CashFlowForecast data={cashflowForecast.monthlyTrend} />

        {/* Financial Assistant */}
        <FinancialAssistant />
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
