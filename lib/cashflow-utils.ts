import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface CashflowForecast {
  projectedIncome: number
  projectedExpenses: number
  netCashflow: number
  savingsRate: number
  monthlyTrend: {
    month: string
    income: number
    expenses: number
    net: number
  }[]
}

export async function getCashflowForecast(userId: string): Promise<CashflowForecast> {
  const supabase = await createServerSupabaseClient()
  
  // Get the last 3 months of data to establish trends
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  
  // Get expenses with proper type for category
  interface ExpenseWithCategory {
    amount: number
    spent_at: string
    category: {
      is_income: boolean
    } | null
  }

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount, spent_at, category:categories(is_income)")
    .eq("user_id", userId)
    .gte("spent_at", threeMonthsAgo.toISOString())
    .order("spent_at", { ascending: true }) as { data: ExpenseWithCategory[] | null }

  // Get recurring income sources
  const { data: incomeSources } = await supabase
    .from("income_sources")
    .select("*")
    .eq("user_id", userId)

  // Group transactions by month
  const monthlyData = expenses?.reduce((acc: any, expense) => {
    const month = new Date(expense.spent_at).toISOString().slice(0, 7)
    if (!acc[month]) {
      acc[month] = { income: 0, expenses: 0 }
    }
    if (expense.category?.is_income) {
      acc[month].income += expense.amount
    } else {
      acc[month].expenses += expense.amount
    }
    return acc
  }, {}) || {}

  // Add recurring income to monthly data
  incomeSources?.forEach(source => {
    const monthlyAmount = normalizeToMonthlyAmount(source.amount, source.frequency)
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].income += monthlyAmount
    })
  })

  // Calculate monthly trends
  const monthlyTrend = Object.entries(monthlyData)
    .map(([month, data]: [string, any]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Calculate month-over-month changes
  const monthOverMonth = {
    income: 0,
    expenses: 0
  }

  if (monthlyTrend.length >= 2) {
    const currentMonth = monthlyTrend[monthlyTrend.length - 1]
    const previousMonth = monthlyTrend[monthlyTrend.length - 2]

    monthOverMonth.income = previousMonth.income > 0
      ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100
      : 0

    monthOverMonth.expenses = previousMonth.expenses > 0
      ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
      : 0
  }

  // Calculate projections based on trends
  const projectedIncome = calculateProjection(monthlyTrend.map(m => m.income))
  const projectedExpenses = calculateProjection(monthlyTrend.map(m => m.expenses))
  const netCashflow = projectedIncome - projectedExpenses
  const savingsRate = projectedIncome > 0 ? (netCashflow / projectedIncome) * 100 : 0

  return {
    projectedIncome,
    projectedExpenses,
    netCashflow,
    savingsRate,
    monthlyTrend,
    monthOverMonth: {
      income: Math.round(monthOverMonth.income),
      expenses: Math.round(monthOverMonth.expenses)
    }
  }
}

function normalizeToMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case "annually":
      return amount / 12
    case "quarterly":
      return amount / 3
    case "bi-weekly":
      return amount * 2.17 // Average bi-weekly periods in a month
    case "weekly":
      return amount * 4.33 // Average weeks in a month
    case "daily":
      return amount * 30.42 // Average days in a month
    default:
      return amount // Monthly
  }
}

function calculateProjection(values: number[]): number {
  if (values.length === 0) return 0
  
  // Simple linear regression
  const n = values.length
  const indices = Array.from({ length: n }, (_, i) => i)
  
  const sumX = indices.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0)
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Project next month
  const nextMonth = n
  const projection = slope * nextMonth + intercept
  
  return Math.max(0, projection) // Ensure non-negative
}
