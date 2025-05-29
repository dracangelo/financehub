"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { ReportType, TimeRange } from "./reports"
import { formatCurrency } from '@/lib/utils'

// Fetch data for reports based on type and time range
export async function fetchReportData(reportType: ReportType, timeRange: TimeRange) {
  const supabase = await createServerSupabaseClient()
  
  if (!supabase) {
    throw new Error("Failed to initialize Supabase client")
  }
  
  const user = await getAuthenticatedUser()
  
  if (!user) {
    throw new Error("Authentication required")
  }
  
  // Get time range filter
  const timeFilter = getTimeRangeFilter(timeRange)
  let reportData: any = null
  
  try {
    console.log(`Fetching data for ${reportType} report with time range ${timeRange}`)
    console.log(`Date range: ${timeFilter.start.toISOString()} to ${timeFilter.end.toISOString()}`)
    
    switch (reportType) {
      case 'overview':
        reportData = await fetchOverviewData(supabase, user.id, timeFilter)
        break
      case 'income-expense':
        reportData = await fetchIncomeExpenseData(supabase, user.id, timeFilter)
        break
      case 'net-worth':
        reportData = await fetchNetWorthData(supabase, user.id)
        break
      case 'budget-analysis':
        reportData = await fetchBudgetAnalysisData(supabase, user.id, timeFilter)
        break
      case 'spending-categories':
        reportData = await fetchSpendingCategoriesData(supabase, user.id, timeFilter)
        break
      case 'income-sources':
        // Use our updated fetchIncomeData function from report-data-provider
        try {
          const { fetchIncomeData } = await import('./report-data-provider')
          reportData = await fetchIncomeData(timeFilter)
          console.log('Using updated fetchIncomeData function for income-sources report')
        } catch (error) {
          console.error('Error importing fetchIncomeData, falling back to fetchIncomeSourcesData:', error)
          reportData = await fetchIncomeSourcesData(supabase, user.id, timeFilter)
        }
        break
      case 'expense-trends':
        // Use our updated fetchExpenseData function from report-data-provider
        try {
          const { fetchExpenseData } = await import('./report-data-provider')
          reportData = await fetchExpenseData(timeFilter)
          console.log('Using updated fetchExpenseData function for expense-trends report')
        } catch (error) {
          console.error('Error importing fetchExpenseData:', error)
          reportData = []
        }
        break
      case 'debt-analysis':
        // Use our updated fetchDebtData function from report-data-provider
        try {
          const { fetchDebtData } = await import('./report-data-provider')
          reportData = await fetchDebtData()
          console.log('Using updated fetchDebtData function for debt-analysis report')
        } catch (error) {
          console.error('Error importing fetchDebtData:', error)
          reportData = []
        }
        break
      case 'subscriptions':
        // Use our updated fetchSubscriptionData function from report-data-provider
        try {
          const { fetchSubscriptionData } = await import('./report-data-provider')
          reportData = await fetchSubscriptionData()
          console.log('Using updated fetchSubscriptionData function for subscriptions report')
        } catch (error) {
          console.error('Error importing fetchSubscriptionData:', error)
          reportData = []
        }
        break
      // Handle other report types with the default case
      case 'budget-analysis':
      case 'spending-categories':
      case 'investments':
      case 'overview':
      case 'income-expense':
      case 'net-worth':
      default:
        console.warn(`Unknown report type: ${reportType}`)
        reportData = []
    }
    
    console.log(`Returning data for ${reportType} report:`, 
      reportData ? (Array.isArray(reportData) ? 
        `${reportData.length} items` : 'Object with data') : 'No data')
    
    return reportData
  } catch (error) {
    console.error(`Error fetching data for ${reportType} report:`, error)
    return []
  }
}

// Helper function to get date range from time range
function getTimeRangeFilter(timeRange: TimeRange): { start: Date, end: Date } {
  const end = new Date()
  let start = new Date()
  
  switch (timeRange) {
    case '7d':
      start.setDate(end.getDate() - 7)
      break
    case '30d':
      start.setDate(end.getDate() - 30)
      break
    case '90d':
      start.setDate(end.getDate() - 90)
      break
    case '1y':
      start.setFullYear(end.getFullYear() - 1)
      break
    case 'ytd':
      start = new Date(end.getFullYear(), 0, 1) // January 1st of current year
      break
    case 'all':
      start = new Date(2000, 0, 1) // Far in the past
      break
    default:
      start.setDate(end.getDate() - 30) // Default to 30 days
  }
  
  return { start, end }
}

// Helper function to map account types to categories
function mapAccountTypeToCategory(accountType: string): string {
  switch (accountType) {
    case 'checking':
    case 'savings':
      return 'Cash'
    case 'investment':
      return 'Investments'
    case 'credit_card':
      return 'Credit Cards'
    case 'loan':
    case 'mortgage':
      return 'Loans'
    case 'cash':
      return 'Cash'
    default:
      return 'Other'
  }
}

// Fetch overview data (expenses, income, budgets)
async function fetchOverviewData(supabase: any, userId: string, timeFilter: { start: Date, end: Date }) {
  // Fetch expenses data
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*, expense_categories(name, color)')
    .eq('user_id', userId)
    .gte('date', timeFilter.start.toISOString())
    .lte('date', timeFilter.end.toISOString())
    .order('date', { ascending: false })
  
  // Fetch income data
  const { data: income, error: incomeError } = await supabase
    .from('incomes')
    .select('*, income_categories(name, color)')
    .eq('user_id', userId)
    .gte('start_date', timeFilter.start.toISOString())
    .lte('start_date', timeFilter.end.toISOString())
    .order('start_date', { ascending: false })
  
  // Fetch budgets
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  
  console.log(`Overview data fetched: ${expenses?.length || 0} expenses, ${income?.length || 0} income items, ${budgets?.length || 0} budgets`)
  
  if ((expenses && !expensesError) || (income && !incomeError)) {
    // Process and combine the data
    const combinedData: any[] = []
    
    // Process expenses
    if (expenses && expenses.length > 0) {
      expenses.forEach((expense: any) => {
        // Format date
        let formattedDate = ''
        try {
          if (expense.date && !isNaN(new Date(expense.date).getTime())) {
            formattedDate = new Date(expense.date).toLocaleDateString()
          }
        } catch (error) {
          // Leave empty if there's an error
        }
        
        // Format amount with currency
        const formattedAmount = new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(expense.amount || 0)
        
        combinedData.push({
          id: expense.id,
          date: expense.date,
          formatted_date: formattedDate,
          name: expense.name || '',
          category: expense.expense_categories?.name || 'Uncategorized',
          category_color: expense.expense_categories?.color || '#888888',
          amount: -Math.abs(parseFloat(expense.amount) || 0), // Negative for expenses
          formatted_amount: '-' + formattedAmount.replace('-', ''),
          type: 'expense',
          notes: expense.notes || '',
          payment_method: expense.payment_method || '',
          recurring: expense.is_recurring || false
        })
      })
    }
    
    // Process income
    if (income && income.length > 0) {
      income.forEach((inc: any) => {
        // Format date
        let formattedDate = ''
        try {
          if (inc.date && !isNaN(new Date(inc.date).getTime())) {
            formattedDate = new Date(inc.date).toLocaleDateString()
          }
        } catch (error) {
          // Leave empty if there's an error
        }
        
        // Format amount with currency
        const formattedAmount = new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(inc.amount || 0)
        
        combinedData.push({
          id: inc.id,
          date: inc.date,
          formatted_date: formattedDate,
          name: inc.name || '',
          category: inc.income_categories?.name || 'Uncategorized',
          category_color: inc.income_categories?.color || '#4CAF50',
          amount: parseFloat(inc.amount) || 0, // Positive for income
          formatted_amount: formattedAmount,
          type: 'income',
          notes: inc.notes || '',
          payment_method: inc.payment_method || '',
          recurring: inc.is_recurring || false
        })
      })
    }
    
    // Sort by date (newest first)
    const sortedData = combinedData.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    
    // Add summary data
    const result: any = [...sortedData]
    
    if (sortedData.length > 0) {
      const totalIncome = income ? income.reduce((sum: number, inc: any) => sum + (parseFloat(inc.amount) || 0), 0) : 0
      const totalExpenses = expenses ? expenses.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0) : 0
      
      result.summary = {
        totalIncome,
        totalExpenses,
        netCashflow: totalIncome - totalExpenses,
        budgetCount: budgets?.length || 0,
        period: `${timeFilter.start.toLocaleDateString()} - ${timeFilter.end.toLocaleDateString()}`
      }
    }
    
    return result
  } else {
    if (expensesError) console.error("Error fetching expenses:", expensesError)
    if (incomeError) console.error("Error fetching income:", incomeError)
    return []
  }
}

// Fetch income and expense data
async function fetchIncomeExpenseData(supabase: any, userId: string, timeFilter: { start: Date, end: Date }) {
  // Fetch expenses data
  const { data: expensesData, error: expensesDataError } = await supabase
    .from('expenses')
    .select('*, expense_categories(name, color)')
    .eq('user_id', userId)
    .gte('date', timeFilter.start.toISOString())
    .lte('date', timeFilter.end.toISOString())
    .order('date', { ascending: false })
  
  // Fetch income data
  const { data: incomeData, error: incomeDataError } = await supabase
    .from('incomes')
    .select('*, income_categories(name, color)')
    .eq('user_id', userId)
    .gte('start_date', timeFilter.start.toISOString())
    .lte('start_date', timeFilter.end.toISOString())
    .order('start_date', { ascending: false })
  
  console.log(`Income/Expense data fetched: ${expensesData?.length || 0} expenses, ${incomeData?.length || 0} income items`)
  
  if ((expensesData && !expensesDataError) || (incomeData && !incomeDataError)) {
    // Calculate monthly totals
    const monthlyData: Record<string, {month: string, expenses: number, income: number, net: number}> = {}
    
    // Process expenses by month
    if (expensesData) {
      expensesData.forEach((expense: any) => {
        if (!expense.date) return
        
        const date = new Date(expense.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthName = date.toLocaleString('default', { month: 'long' })
        const monthDisplay = `${monthName} ${date.getFullYear()}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { 
            month: monthDisplay, 
            expenses: 0, 
            income: 0,
            net: 0
          }
        }
        
        monthlyData[monthKey].expenses += parseFloat(expense.amount) || 0
      })
    }
    
    // Process income by month
    if (incomeData) {
      incomeData.forEach((inc: any) => {
        if (!inc.date) return
        
        const date = new Date(inc.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthName = date.toLocaleString('default', { month: 'long' })
        const monthDisplay = `${monthName} ${date.getFullYear()}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { 
            month: monthDisplay, 
            expenses: 0, 
            income: 0,
            net: 0
          }
        }
        
        monthlyData[monthKey].income += parseFloat(inc.amount) || 0
      })
    }
    
    // Calculate net values and format data
    Object.values(monthlyData).forEach(month => {
      month.net = month.income - month.expenses
    })
    
    // Convert to array and sort by month (newest first)
    const monthlyTotals = Object.entries(monthlyData)
      .map(([key, values]) => ({
        monthKey: key,
        ...values,
        formatted_expenses: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(values.expenses),
        formatted_income: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(values.income),
        formatted_net: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(values.net)
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    
    // Process individual transactions
    const transactions: any[] = []
    
    // Add expenses
    if (expensesData) {
      expensesData.forEach((expense: any) => {
        transactions.push({
          id: expense.id,
          date: expense.date,
          formatted_date: new Date(expense.date).toLocaleDateString(),
          name: expense.name || '',
          category: expense.expense_categories?.name || 'Uncategorized',
          category_color: expense.expense_categories?.color || '#888888',
          amount: -Math.abs(parseFloat(expense.amount) || 0), // Negative for expenses
          formatted_amount: '-' + new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
          }).format(expense.amount || 0).replace('-', ''),
          type: 'expense'
        })
      })
    }
    
    // Add income
    if (incomeData) {
      incomeData.forEach((inc: any) => {
        transactions.push({
          id: inc.id,
          date: inc.date,
          formatted_date: new Date(inc.date).toLocaleDateString(),
          name: inc.name || '',
          category: inc.income_categories?.name || 'Uncategorized',
          category_color: inc.income_categories?.color || '#4CAF50',
          amount: parseFloat(inc.amount) || 0, // Positive for income
          formatted_amount: new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
          }).format(inc.amount || 0),
          type: 'income'
        })
      })
    }
    
    // Sort transactions by date (newest first)
    transactions.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    
    // Calculate totals
    const totalIncome = incomeData ? incomeData.reduce((sum: number, inc: any) => sum + (parseFloat(inc.amount) || 0), 0) : 0
    const totalExpenses = expensesData ? expensesData.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0) : 0
    const netCashflow = totalIncome - totalExpenses
    
    // Prepare final data structure
    return {
      transactions,
      monthlyTotals,
      summary: {
        totalIncome,
        totalExpenses,
        netCashflow,
        formatted_income: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalIncome),
        formatted_expenses: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalExpenses),
        formatted_net: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(netCashflow),
        period: `${timeFilter.start.toLocaleDateString()} - ${timeFilter.end.toLocaleDateString()}`
      }
    }
  } else {
    if (expensesDataError) console.error("Error fetching expenses data:", expensesDataError)
    if (incomeDataError) console.error("Error fetching income data:", incomeDataError)
    return []
  }
}

// Fetch net worth data
async function fetchNetWorthData(supabase: any, userId: string) {
  // Fetch accounts to determine assets and liabilities
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  console.log(`Net worth data fetched: ${accounts?.length || 0} accounts`)
  
  if (!accountsError && accounts && accounts.length > 0) {
    // Categorize accounts as assets or liabilities
    const assets = accounts.filter((account: any) => 
      account.type === 'checking' || 
      account.type === 'savings' || 
      account.type === 'investment' || 
      account.type === 'cash' ||
      account.type === 'other_asset'
    )
    
    const liabilities = accounts.filter((account: any) => 
      account.type === 'credit_card' || 
      account.type === 'loan' || 
      account.type === 'mortgage' ||
      account.type === 'other_liability'
    )
    
    // Process assets
    const processedAssets = assets.map((asset: any) => {
      return {
        id: asset.id,
        name: asset.name || 'Unnamed Account',
        type: 'asset',
        account_type: asset.type || 'other',
        category: mapAccountTypeToCategory(asset.type) || 'Other',
        value: parseFloat(asset.current_balance) || 0,
        formatted_value: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(parseFloat(asset.current_balance) || 0),
        last_updated: asset.updated_at || asset.created_at || new Date().toISOString(),
        notes: asset.notes || ''
      }
    })
    
    // Process liabilities
    const processedLiabilities = liabilities.map((liability: any) => {
      return {
        id: liability.id,
        name: liability.name || 'Unnamed Account',
        type: 'liability',
        account_type: liability.type || 'other',
        category: mapAccountTypeToCategory(liability.type) || 'Other',
        value: parseFloat(liability.current_balance) || 0,
        formatted_value: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(parseFloat(liability.current_balance) || 0),
        last_updated: liability.updated_at || liability.created_at || new Date().toISOString(),
        notes: liability.notes || ''
      }
    })
    
    // Calculate totals
    const totalAssets = assets.reduce((sum: number, asset: any) => sum + (parseFloat(asset.current_balance) || 0), 0)
    const totalLiabilities = liabilities.reduce((sum: number, liability: any) => sum + (parseFloat(liability.current_balance) || 0), 0)
    const netWorth = totalAssets - totalLiabilities
    
    // Add summary data
    return {
      assets: processedAssets,
      liabilities: processedLiabilities,
      summary: {
        totalAssets,
        totalLiabilities,
        netWorth,
        formatted_assets: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalAssets),
        formatted_liabilities: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalLiabilities),
        formatted_net_worth: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(netWorth),
        asset_count: assets.length,
        liability_count: liabilities.length
      }
    }
  } else {
    if (accountsError) console.error("Error fetching accounts:", accountsError)
    return []
  }
}

// Fetch budget analysis data
async function fetchBudgetAnalysisData(supabase: any, userId: string, timeFilter: { start: Date, end: Date }) {
  // Fetch budgets
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  // Fetch expenses for the time period
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*, expense_categories(name, color)')
    .eq('user_id', userId)
    .gte('date', timeFilter.start.toISOString())
    .lte('date', timeFilter.end.toISOString())
  
  console.log(`Budget analysis data fetched: ${budgets?.length || 0} budgets, ${expenses?.length || 0} expenses`)
  
  if (!budgetsError && budgets && budgets.length > 0) {
    // Process budget data
    const budgetAnalysis = budgets.map((budget: any) => {
      // Find expenses for this budget's category
      const categoryExpenses = expenses?.filter((expense: any) => {
        return expense.category_id === budget.category_id
      }) || []
      
      // Calculate total spent
      const totalSpent = categoryExpenses.reduce((sum: number, expense: any) => {
        return sum + (parseFloat(expense.amount) || 0)
      }, 0)
      
      // Calculate percentage of budget used
      const budgetAmount = parseFloat(budget.amount) || 0
      const percentUsed = budgetAmount > 0 ? (totalSpent / budgetAmount * 100) : 0
      const remaining = budgetAmount - totalSpent
      
      return {
        id: budget.id,
        name: budget.name || 'Unnamed Budget',
        category: budget.category_name || 'Uncategorized',
        budget_amount: budgetAmount,
        formatted_budget: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(budgetAmount),
        spent: totalSpent,
        formatted_spent: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalSpent),
        remaining: remaining,
        formatted_remaining: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(remaining),
        percent_used: percentUsed,
        formatted_percent: `${percentUsed.toFixed(1)}%`,
        status: percentUsed >= 100 ? 'over' : percentUsed >= 80 ? 'warning' : 'good',
        expense_count: categoryExpenses.length,
        period: budget.period || 'monthly'
      }
    })
    
    // Calculate overall budget metrics
    const totalBudgeted = budgets.reduce((sum: number, budget: any) => sum + (parseFloat(budget.amount) || 0), 0)
    const totalSpent = expenses ? expenses.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0) : 0
    const overallPercentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted * 100) : 0
    
    return {
      budgets: budgetAnalysis,
      summary: {
        total_budgeted: totalBudgeted,
        formatted_budgeted: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalBudgeted),
        total_spent: totalSpent,
        formatted_spent: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalSpent),
        remaining: totalBudgeted - totalSpent,
        formatted_remaining: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalBudgeted - totalSpent),
        percent_used: overallPercentUsed,
        formatted_percent: `${overallPercentUsed.toFixed(1)}%`,
        budget_count: budgets.length,
        period: `${timeFilter.start.toLocaleDateString()} - ${timeFilter.end.toLocaleDateString()}`
      }
    }
  } else {
    if (budgetsError) console.error("Error fetching budgets:", budgetsError)
    return []
  }
}

// Fetch spending by category data
async function fetchSpendingCategoriesData(supabase: any, userId: string, timeFilter: { start: Date, end: Date }) {
  // Fetch expenses with categories
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*, expense_categories(id, name, color)')
    .eq('user_id', userId)
    .gte('date', timeFilter.start.toISOString())
    .lte('date', timeFilter.end.toISOString())
  
  console.log(`Spending categories data fetched: ${expenses?.length || 0} expenses`)
  
  if (!expensesError && expenses && expenses.length > 0) {
    // Calculate total spending
    const totalSpending = expenses.reduce((sum: number, expense: any) => {
      return sum + (parseFloat(expense.amount) || 0)
    }, 0)
    
    // Group expenses by category
    const categoryMap: Record<string, any> = {}
    
    expenses.forEach((expense: any) => {
      const categoryId = expense.category_id || 'uncategorized'
      const categoryName = expense.expense_categories?.name || 'Uncategorized'
      const categoryColor = expense.expense_categories?.color || '#888888'
      const amount = parseFloat(expense.amount) || 0
      
      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          id: categoryId,
          category: categoryName,
          color: categoryColor,
          amount: 0,
          transaction_count: 0,
          transactions: []
        }
      }
      
      categoryMap[categoryId].amount += amount
      categoryMap[categoryId].transaction_count += 1
      categoryMap[categoryId].transactions.push({
        id: expense.id,
        date: expense.date,
        name: expense.name,
        amount: amount,
        formatted_amount: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(amount)
      })
    })
    
    // Format category data
    const categories = Object.values(categoryMap).map((category: any) => {
      const percentOfTotal = totalSpending > 0 ? (category.amount / totalSpending * 100) : 0
      
      return {
        ...category,
        formatted_amount: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(category.amount),
        percent_of_total: percentOfTotal,
        formatted_percent: `${percentOfTotal.toFixed(1)}%`,
        average_transaction: category.transaction_count > 0 ? 
          (category.amount / category.transaction_count) : 0,
        formatted_average: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(category.transaction_count > 0 ? 
          (category.amount / category.transaction_count) : 0)
      }
    }).sort((a: any, b: any) => b.amount - a.amount)
    
    return {
      categories,
      summary: {
        total_spending: totalSpending,
        formatted_total: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalSpending),
        category_count: categories.length,
        transaction_count: expenses.length,
        period: `${timeFilter.start.toLocaleDateString()} - ${timeFilter.end.toLocaleDateString()}`
      }
    }
  } else {
    if (expensesError) console.error("Error fetching expenses for categories:", expensesError)
    return []
  }
}

// Fetch income sources data
async function fetchIncomeSourcesData(supabase: any, userId: string, timeFilter: { start: Date, end: Date }) {
  // Fetch all income data with categories and complete details
  const { data: incomes, error: incomesError } = await supabase
    .from('incomes')
    .select('*, income_categories(*)')
    .eq('user_id', userId)
    .gte('start_date', timeFilter.start.toISOString())
    .lte('start_date', timeFilter.end.toISOString())
    .order('start_date', { ascending: false })
  
  // Fetch all income categories to ensure we have complete category data
  const { data: allCategories, error: categoriesError } = await supabase
    .from('income_categories')
    .select('*')
    .eq('user_id', userId)
  
  console.log(`Income sources data fetched: ${incomes?.length || 0} income entries, ${allCategories?.length || 0} categories`)
  
  if (!incomesError && incomes && incomes.length > 0) {
    // Calculate total income
    const totalIncome = incomes.reduce((sum: number, income: any) => {
      return sum + (parseFloat(income.amount) || 0)
    }, 0)
    
    // Process all income entries with full details
    const processedIncomes = incomes.map((income: any) => {
      // Format date
      let formattedDate = ''
      try {
        if (income.date && !isNaN(new Date(income.date).getTime())) {
          formattedDate = new Date(income.date).toLocaleDateString()
        }
      } catch (error) {
        // Leave empty if there's an error
      }
      
      // Format amount with currency
      const formattedAmount = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(income.amount || 0)
      
      return {
        id: income.id,
        name: income.name || '',
        description: income.description || '',
        amount: parseFloat(income.amount) || 0,
        formatted_amount: formattedAmount,
        date: income.date,
        formatted_date: formattedDate,
        category_id: income.category_id,
        category_name: income.income_categories?.name || 'Uncategorized',
        category_color: income.income_categories?.color || '#4CAF50',
        payment_method: income.payment_method || '',
        is_recurring: income.is_recurring || false,
        frequency: income.frequency || 'one-time',
        notes: income.notes || '',
        created_at: income.created_at,
        updated_at: income.updated_at
      }
    })
    
    // Group income by source/category
    const sourceMap: Record<string, any> = {}
    
    incomes.forEach((income: any) => {
      const categoryId = income.category_id || 'uncategorized'
      const categoryName = income.income_categories?.name || 'Uncategorized'
      const categoryColor = income.income_categories?.color || '#4CAF50'
      const amount = parseFloat(income.amount) || 0
      const isRecurring = income.is_recurring || false
      const frequency = income.frequency || 'one-time'
      
      if (!sourceMap[categoryId]) {
        sourceMap[categoryId] = {
          id: categoryId,
          source: categoryName,
          color: categoryColor,
          amount: 0,
          transaction_count: 0,
          recurring_count: 0,
          transactions: [],
          frequencies: {}
        }
      }
      
      // Update source totals
      sourceMap[categoryId].amount += amount
      sourceMap[categoryId].transaction_count += 1
      
      // Track recurring income
      if (isRecurring) {
        sourceMap[categoryId].recurring_count += 1
      }
      
      // Track frequency distribution
      if (!sourceMap[categoryId].frequencies[frequency]) {
        sourceMap[categoryId].frequencies[frequency] = 0
      }
      sourceMap[categoryId].frequencies[frequency] += 1
      
      // Add transaction details
      sourceMap[categoryId].transactions.push({
        id: income.id,
        date: income.date,
        formatted_date: new Date(income.date).toLocaleDateString(),
        name: income.name || '',
        description: income.description || '',
        amount: amount,
        formatted_amount: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(amount),
        is_recurring: isRecurring,
        frequency: frequency,
        payment_method: income.payment_method || ''
      })
    })
    
    // Format source data
    const sources = Object.values(sourceMap).map((source: any) => {
      const percentOfTotal = totalIncome > 0 ? (source.amount / totalIncome * 100) : 0
      const recurringPercentage = source.transaction_count > 0 ? 
        (source.recurring_count / source.transaction_count * 100) : 0
      
      // Format frequencies for display
      const formattedFrequencies = Object.entries(source.frequencies).map(([freq, count]: [string, any]) => ({
        frequency: freq,
        count: count,
        percentage: source.transaction_count > 0 ? (count / source.transaction_count * 100) : 0
      })).sort((a, b) => b.count - a.count)
      
      return {
        ...source,
        formatted_amount: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(source.amount),
        percent_of_total: percentOfTotal,
        formatted_percent: `${percentOfTotal.toFixed(1)}%`,
        average_transaction: source.transaction_count > 0 ? 
          (source.amount / source.transaction_count) : 0,
        formatted_average: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(source.transaction_count > 0 ? 
          (source.amount / source.transaction_count) : 0),
        recurring_percentage: recurringPercentage,
        formatted_recurring: `${recurringPercentage.toFixed(1)}%`,
        frequencies: formattedFrequencies
      }
    }).sort((a: any, b: any) => b.amount - a.amount)
    
    // Get monthly breakdown
    const monthlyData: Record<string, {amount: number, transactions: number, recurring: number}> = {}
    
    incomes.forEach((income: any) => {
      if (!income.date) return
      
      const date = new Date(income.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const amount = parseFloat(income.amount) || 0
      const isRecurring = income.is_recurring || false
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          amount: 0,
          transactions: 0,
          recurring: 0
        }
      }
      
      monthlyData[monthKey].amount += amount
      monthlyData[monthKey].transactions += 1
      if (isRecurring) {
        monthlyData[monthKey].recurring += 1
      }
    })
    
    // Format monthly data
    const monthlyIncome = Object.entries(monthlyData).map(([key, data]) => {
      const [year, month] = key.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      const monthName = date.toLocaleString('default', { month: 'long' })
      
      return {
        month: `${monthName} ${year}`,
        monthKey: key,
        amount: data.amount,
        formatted_amount: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(data.amount),
        transaction_count: data.transactions,
        recurring_count: data.recurring,
        recurring_percentage: data.transactions > 0 ? 
          (data.recurring / data.transactions * 100) : 0,
        average_per_transaction: data.transactions > 0 ? 
          (data.amount / data.transactions) : 0,
        formatted_average: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(data.transactions > 0 ? (data.amount / data.transactions) : 0)
      }
    }).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    
    // Calculate frequency distribution across all income
    const frequencyDistribution: Record<string, {count: number, amount: number}> = {}
    incomes.forEach((income: any) => {
      const frequency = income.frequency || 'one-time'
      const amount = parseFloat(income.amount) || 0
      
      if (!frequencyDistribution[frequency]) {
        frequencyDistribution[frequency] = {
          count: 0,
          amount: 0
        }
      }
      
      frequencyDistribution[frequency].count += 1
      frequencyDistribution[frequency].amount += amount
    })
    
    // Format frequency distribution
    const frequencies = Object.entries(frequencyDistribution).map(([frequency, data]) => ({
      frequency,
      count: data.count,
      percentage: incomes.length > 0 ? (data.count / incomes.length * 100) : 0,
      amount: data.amount,
      formatted_amount: new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(data.amount),
      percent_of_total: totalIncome > 0 ? (data.amount / totalIncome * 100) : 0
    })).sort((a, b) => b.count - a.count)
    
    return {
      incomes: processedIncomes,
      sources,
      monthlyIncome,
      frequencies,
      categories: allCategories || [],
      summary: {
        total_income: totalIncome,
        formatted_total: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalIncome),
        source_count: sources.length,
        transaction_count: incomes.length,
        monthly_average: totalIncome / Math.max(1, monthlyIncome.length),
        formatted_monthly_average: new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(totalIncome / Math.max(1, monthlyIncome.length)),
        recurring_count: incomes.filter(inc => inc.is_recurring).length,
        recurring_percentage: incomes.length > 0 ? 
          (incomes.filter(inc => inc.is_recurring).length / incomes.length * 100) : 0,
        period: `${timeFilter.start.toLocaleDateString()} - ${timeFilter.end.toLocaleDateString()}`
      }
    }
  } else {
    if (incomesError) console.error("Error fetching income sources:", incomesError)
    if (categoriesError) console.error("Error fetching income categories:", categoriesError)
    return []
  }
}
