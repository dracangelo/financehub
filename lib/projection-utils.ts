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
  totalDeductions?: number
  totalHustles?: number
  adjustedAmount?: number
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
  
  // Get recurring income sources from the new income schema
  // Only include incomes that are recurring (not one-time) and haven't reached their end date
  const { data: incomeSources, error: incomeError } = await supabase
    .from("incomes")
    .select("*, category:income_categories(id, name), deductions:income_deductions(*), hustles:income_hustles(*)")
    .eq("user_id", userId)
    .neq("recurrence", "none") // Exclude one-time payments
    .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`) // Only include active incomes
  
  if (incomeError) {
    console.error("Error fetching incomes:", incomeError)
  }

  // Get recurring expenses
  const { data: recurringExpenses, error: expenseError } = await supabase
    .from("expenses")
    .select(`
      *,
      categories:expense_categories(id, name, parent_id)
    `)
    .eq("user_id", userId)
    .neq("recurrence", "none")
  
  if (expenseError) {
    console.error("Error fetching recurring expenses:", expenseError)
  }

  // Calculate projected monthly income using the monthly_equivalent_amount from the new schema
  const projectedIncomeBreakdown = (incomeSources || []).map(source => {
    // Calculate total deductions
    let totalDeductions = 0;
    if (source.deductions && Array.isArray(source.deductions)) {
      totalDeductions = source.deductions.reduce((sum: number, deduction: any) => {
        return sum + (deduction.amount || 0);
      }, 0);
    }
    
    // Calculate total side hustles
    let totalHustles = 0;
    if (source.hustles && Array.isArray(source.hustles)) {
      totalHustles = source.hustles.reduce((sum: number, hustle: any) => {
        return sum + (hustle.hustle_amount || 0);
      }, 0);
    }
    
    // Calculate adjusted amount with deductions and side hustles
    const adjustedAmount = source.amount - totalDeductions + totalHustles;
    
    // Use the monthly_equivalent_amount that's already calculated by the database
    // If not available, calculate it based on the adjusted amount
    const monthlyAmount = source.monthly_equivalent_amount || normalizeToMonthlyAmount(adjustedAmount, source.recurrence)
    const nextPaymentDate = calculateNextPaymentDate(source)
    
    return {
      id: source.id,
      name: source.source_name,
      amount: monthlyAmount,
      sourceType: source.category?.name || 'Income',
      frequency: source.recurrence,
      nextPaymentDate,
      // Add additional fields for UI display
      totalDeductions,
      totalHustles,
      adjustedAmount
    }
  })

  // Calculate projected monthly expenses
  const projectedExpensesBreakdown = (recurringExpenses || []).map(expense => {
    const frequency = expense.recurrence || 'monthly'
    const monthlyAmount = normalizeToMonthlyAmount(expense.amount, frequency)
    
    // Calculate next due date based on recurrence pattern
    const lastDate = new Date(expense.expense_date)
    let nextDueDate = null
    
    if (frequency !== 'none') {
      const nextDate = new Date(lastDate)
      
      if (frequency === 'weekly') {
        nextDate.setDate(lastDate.getDate() + 7)
      } else if (frequency === 'bi_weekly') {
        nextDate.setDate(lastDate.getDate() + 14)
      } else if (frequency === 'monthly') {
        nextDate.setMonth(lastDate.getMonth() + 1)
      } else if (frequency === 'quarterly') {
        nextDate.setMonth(lastDate.getMonth() + 3)
      } else if (frequency === 'semi_annual') {
        nextDate.setMonth(lastDate.getMonth() + 6)
      } else if (frequency === 'annual') {
        nextDate.setFullYear(lastDate.getFullYear() + 1)
      }
      
      nextDueDate = nextDate.toISOString()
    }
    
    // Get category name from the first category if available
    const categoryName = expense.categories && expense.categories.length > 0 
      ? expense.categories[0].name 
      : 'Uncategorized'
    
    return {
      id: expense.id,
      title: expense.merchant || 'Recurring Expense',
      amount: monthlyAmount,
      category: categoryName,
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
 * Normalize an amount to a monthly value based on recurrence frequency
 * This matches the calculation in the income.sql schema
 */
function normalizeToMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency?.toLowerCase()) {
    case 'none':
      return amount // One-time payment
    case 'weekly':
      return amount * 52 / 12 // Weekly to monthly conversion
    case 'bi_weekly':
      return amount * 26 / 12 // Bi-weekly to monthly conversion
    case 'monthly':
      return amount // Already monthly
    case 'quarterly':
      return amount / 3 // Quarterly to monthly
    case 'semi_annual':
      return amount / 6 // Semi-annual to monthly
    case 'annual':
      return amount / 12 // Annual to monthly
    default:
      return amount
  }
}

/**
 * Calculate the next payment date for an income source based on the new income schema
 * and its recurrence pattern
 */
function calculateNextPaymentDate(source: any): string | null {
  if (!source.start_date) {
    return null
  }

  const startDate = new Date(source.start_date)
  const today = new Date()
  let nextPayment: Date
  
  // Calculate next payment date based on recurrence pattern
  switch (source.recurrence) {
    case 'weekly':
      // Find the next occurrence of the same day of week
      nextPayment = new Date(today)
      const dayDiff = startDate.getDay() - today.getDay()
      nextPayment.setDate(today.getDate() + (dayDiff >= 0 ? dayDiff : dayDiff + 7))
      // If today is the day but time has passed, move to next week
      if (nextPayment.toDateString() === today.toDateString()) {
        nextPayment.setDate(nextPayment.getDate() + 7)
      }
      break
      
    case 'bi_weekly':
      // Similar to weekly but with 2-week intervals
      nextPayment = new Date(today)
      const startDay = startDate.getDay()
      const todayDay = today.getDay()
      
      // Calculate days since the start date
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const weeksFromStart = Math.floor(daysSinceStart / 7)
      
      if (weeksFromStart % 2 === 0 && startDay >= todayDay) {
        // We're in a payment week and the payment day hasn't passed
        nextPayment.setDate(today.getDate() + (startDay - todayDay))
      } else if (weeksFromStart % 2 === 0) {
        // We're in a payment week but the payment day has passed
        nextPayment.setDate(today.getDate() + (startDay - todayDay) + 14)
      } else {
        // We're in a non-payment week
        nextPayment.setDate(today.getDate() + (startDay - todayDay) + (7 - ((weeksFromStart % 2) * 7)))
      }
      break
      
    case 'monthly':
      // Use the same day of month
      const paymentDay = startDate.getDate()
      nextPayment = new Date(today.getFullYear(), today.getMonth(), paymentDay)
      
      // If the payment day has passed this month, move to next month
      if (nextPayment < today) {
        nextPayment.setMonth(nextPayment.getMonth() + 1)
      }
      break
      
    case 'quarterly':
      // Every 3 months on the same day
      const quarterPaymentDay = startDate.getDate()
      const startMonth = startDate.getMonth()
      
      // Calculate which month in the quarter this payment falls
      const monthInQuarter = startMonth % 3
      
      // Calculate the next quarter month
      let nextQuarterMonth = today.getMonth()
      while ((nextQuarterMonth % 3) !== monthInQuarter || 
             (nextQuarterMonth === today.getMonth() && quarterPaymentDay < today.getDate())) {
        nextQuarterMonth++
      }
      
      nextPayment = new Date(today.getFullYear(), nextQuarterMonth, quarterPaymentDay)
      break
      
    case 'semi_annual':
      // Every 6 months on the same day
      const semiAnnualPaymentDay = startDate.getDate()
      const semiAnnualStartMonth = startDate.getMonth()
      
      // Calculate which month in the half-year this payment falls
      const monthInHalfYear = semiAnnualStartMonth % 6
      
      // Calculate the next half-year month
      let nextHalfYearMonth = today.getMonth()
      while ((nextHalfYearMonth % 6) !== monthInHalfYear || 
             (nextHalfYearMonth === today.getMonth() && semiAnnualPaymentDay < today.getDate())) {
        nextHalfYearMonth++
      }
      
      nextPayment = new Date(today.getFullYear(), nextHalfYearMonth, semiAnnualPaymentDay)
      break
      
    case 'annual':
      // Once a year on the same month and day
      const annualMonth = startDate.getMonth()
      const annualDay = startDate.getDate()
      
      nextPayment = new Date(today.getFullYear(), annualMonth, annualDay)
      
      // If this year's date has passed, move to next year
      if (nextPayment < today) {
        nextPayment.setFullYear(nextPayment.getFullYear() + 1)
      }
      break
      
    default:
      // Default to monthly behavior
      const defaultPaymentDay = startDate.getDate()
      nextPayment = new Date(today.getFullYear(), today.getMonth(), defaultPaymentDay)
      
      if (nextPayment < today) {
        nextPayment.setMonth(nextPayment.getMonth() + 1)
      }
  }
  
  // If there's an end_date and the next payment is after it, return null
  if (source.end_date && new Date(source.end_date) < nextPayment) {
    return null
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
