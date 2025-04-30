import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface ProjectedFinances {
  projectedIncome: number
  projectedExpenses: number
  netCashflow: number
  savingsRate: number
  projectedIncomeBreakdown: ProjectedIncomeSource[]
  projectedExpensesBreakdown: ProjectedExpense[]
  monthlyTrend: {
    month: string
    income: number
    expenses: number
    net: number
  }[]
}

export interface ProjectedIncomeSource {
  id: string
  name: string
  amount: number
  sourceType: string
  frequency: string
  nextPaymentDate: string | null
}

export interface ProjectedExpense {
  id: string
  title: string
  amount: number
  category: string
  frequency: string
  nextDueDate: string | null
}

/**
 * Get projected income and expenses for the dashboard
 * @param userId User ID to get projections for
 * @returns Projected finances including income, expenses, and trends
 */
export async function getProjectedFinances(userId: string): Promise<ProjectedFinances> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    throw new Error("Failed to create Supabase client")
  }
  
  // Get recurring income sources
  const { data: incomeSources, error: incomeError } = await supabase
    .from("income_sources")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
  
  if (incomeError) {
    console.error("Error fetching income sources:", incomeError)
  }

  // Get recurring expenses
  const { data: recurringExpenses, error: expenseError } = await supabase
    .from("transactions")
    .select(`
      *,
      account:accounts(id, name, type, institution),
      category:categories(id, name, color, icon, is_income),
      recurring_pattern:recurring_patterns(id, frequency, confidence, next_expected_date, is_subscription)
    `)
    .eq("user_id", userId)
    .eq("is_income", false)
    .eq("is_recurring", true)
  
  if (expenseError) {
    console.error("Error fetching recurring expenses:", expenseError)
  }

  // Calculate projected monthly income
  const projectedIncomeBreakdown = (incomeSources || []).map(source => {
    const monthlyAmount = normalizeToMonthlyAmount(source.amount, source.frequency)
    const nextPaymentDate = calculateNextPaymentDate(source)
    
    return {
      id: source.id,
      name: source.name,
      amount: monthlyAmount,
      sourceType: source.source_type,
      frequency: source.frequency,
      nextPaymentDate
    }
  })

  // Calculate projected monthly expenses
  const projectedExpensesBreakdown = (recurringExpenses || []).map(expense => {
    const frequency = expense.recurring_pattern?.frequency || 'monthly'
    const monthlyAmount = normalizeToMonthlyAmount(expense.amount, frequency)
    const nextDueDate = expense.recurring_pattern?.next_expected_date || null
    
    return {
      id: expense.id,
      title: expense.description || 'Recurring Expense',
      amount: monthlyAmount,
      category: expense.category?.name || 'Uncategorized',
      frequency: frequency,
      nextDueDate
    }
  })

  // Calculate total projected income and expenses
  const projectedIncome = projectedIncomeBreakdown.reduce((sum, source) => sum + source.amount, 0)
  const projectedExpenses = projectedExpensesBreakdown.reduce((sum, expense) => sum + expense.amount, 0)
  const netCashflow = projectedIncome - projectedExpenses
  const savingsRate = projectedIncome > 0 ? (netCashflow / projectedIncome) * 100 : 0

  // Get historical data for trends (last 3 months)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  
  const { data: historicalExpenses } = await supabase
    .from("expenses")
    .select("amount, spent_at, category")
    .eq("user_id", userId)
    .gte("spent_at", threeMonthsAgo.toISOString())
    .order("spent_at", { ascending: true })

  // Group historical transactions by month
  const monthlyData = (historicalExpenses || []).reduce((acc: any, expense) => {
    const month = new Date(expense.spent_at).toISOString().slice(0, 7)
    if (!acc[month]) {
      acc[month] = { income: 0, expenses: 0 }
    }
    
    // Determine if this is income or expense based on category
    // This is a simplified approach - you may need to adjust based on your category structure
    const isIncome = expense.category?.toLowerCase().includes('income')
    
    if (isIncome) {
      acc[month].income += expense.amount
    } else {
      acc[month].expenses += expense.amount
    }
    return acc
  }, {})

  // Calculate monthly trends
  const monthlyTrend = Object.entries(monthlyData)
    .map(([month, data]: [string, any]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return {
    projectedIncome,
    projectedExpenses,
    netCashflow,
    savingsRate,
    projectedIncomeBreakdown,
    projectedExpensesBreakdown,
    monthlyTrend
  }
}

/**
 * Normalize an amount to a monthly value based on frequency
 */
function normalizeToMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency?.toLowerCase()) {
    case 'daily':
      return amount * 30.42 // Average days in a month
    case 'weekly':
      return amount * 4.35 // Average weeks in a month
    case 'biweekly':
      return amount * 2.17 // Average bi-weeks in a month
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'annually':
      return amount / 12
    default:
      return amount
  }
}

/**
 * Calculate the next payment date for an income source
 */
function calculateNextPaymentDate(source: any): string | null {
  if (!source.payment_day) {
    return null
  }

  const today = new Date()
  const nextPayment = new Date(today.getFullYear(), today.getMonth(), source.payment_day)
  
  // If the payment day has passed this month, move to next month
  if (nextPayment < today) {
    nextPayment.setMonth(nextPayment.getMonth() + 1)
  }
  
  return nextPayment.toISOString()
}

/**
 * Calculate the next due date for a recurring expense
 * Note: This function is kept for reference but no longer used as we're getting
 * the next expected date directly from the recurring_patterns table
 */
function calculateNextExpenseDate(expense: any): string | null {
  if (!expense.recurring_frequency) {
    return null
  }

  const today = new Date()
  const lastSpent = new Date(expense.spent_at)
  let nextDue = new Date(lastSpent)
  
  switch (expense.recurring_frequency.toLowerCase()) {
    case 'daily':
      nextDue.setDate(lastSpent.getDate() + 1)
      break
    case 'weekly':
      nextDue.setDate(lastSpent.getDate() + 7)
      break
    case 'biweekly':
      nextDue.setDate(lastSpent.getDate() + 14)
      break
    case 'monthly':
      nextDue.setMonth(lastSpent.getMonth() + 1)
      break
    case 'quarterly':
      nextDue.setMonth(lastSpent.getMonth() + 3)
      break
    case 'annually':
      nextDue.setFullYear(lastSpent.getFullYear() + 1)
      break
    default:
      return null
  }
  
  // If the next due date has passed, keep adding the frequency until we get a future date
  while (nextDue < today) {
    switch (expense.recurring_frequency.toLowerCase()) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + 1)
        break
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + 7)
        break
      case 'biweekly':
        nextDue.setDate(nextDue.getDate() + 14)
        break
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + 1)
        break
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3)
        break
      case 'annually':
        nextDue.setFullYear(nextDue.getFullYear() + 1)
        break
    }
  }
  
  return nextDue.toISOString()
}
