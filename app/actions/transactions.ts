"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getAuthenticatedUser } from "@/lib/auth"
import { getExpenses } from "./expenses"
import { getIncomeSources } from "./income-sources"

export async function getTransactions() {
  try {
    // Make sure to await the client creation
    const supabase = await createServerSupabaseClient()

    // Get the current user
    const user = await getAuthenticatedUser()

    if (!user) {
      console.log("No authenticated user found")
      return []
    }

    console.log("Fetching transactions for user:", user.id)

    // Fix the query to correctly join with categories and accounts tables
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        account:accounts(id, name, type, institution),
        category:categories(id, name, color, icon, is_income)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching transactions:", error.message, error.details, error.hint)
      return []
    }

    console.log(`Successfully fetched ${data?.length || 0} transactions`)
    return data
  } catch (error) {
    console.error("Unexpected error in getTransactions:", error)
    return []
  }
}

export async function getTransactionById(id: string) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      account:accounts(id, name, type, institution),
      category:categories(id, name, color, icon, is_income)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error) {
    console.error("Error fetching transaction:", error)
    return null
  }

  return data
}

export async function createTransaction(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  // First, ensure all static categories exist in the database
  const { ensureStaticCategories } = await import("./categories")
  const categoriesResult = await ensureStaticCategories()
  
  if (!categoriesResult.success) {
    console.error("Error ensuring categories:", categoriesResult.message)
  } else {
    console.log(`Categories ensured: ${categoriesResult.created} new categories created`)
  }

  // Extract form data - only include fields that exist in the database
  const description = formData.get("description") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const isIncome = formData.get("is_income") === "true"
  const accountId = formData.get("account_id") as string
  const categoryId = formData.get("category_id") as string
  const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0]

  // Validate required fields
  if (!description || isNaN(amount) || !accountId) {
    throw new Error("Description, amount, and account are required")
  }

  // Verify account belongs to user
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .single()

  if (accountError || !account) {
    throw new Error("Invalid account or account does not belong to user")
  }
  
  // Check if we need to use a default category
  let useCategoryId = categoryId;
  
  // If no category is provided
  if (!categoryId) {
    // Find an appropriate default category based on transaction type
    const defaultCategoryName = isIncome ? "Other Income" : "Other";
    
    // Check if the default category exists
    const { data: defaultCategory, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", defaultCategoryName)
      .eq("is_income", isIncome)
      .eq("user_id", user.id)
      .single();
      
    if (categoryError || !defaultCategory) {
      console.error("Error finding default category:", categoryError);
      throw new Error("Could not find an appropriate category for this transaction");
    }
    
    useCategoryId = defaultCategory.id;
  }

  // Create transaction with only the fields that exist in the database
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      description,
      amount,
      is_income: isIncome,
      account_id: accountId,
      category_id: useCategoryId,
      date: date
    })
    .select(`
      *,
      account:accounts(id, name, type, institution)
    `)

  if (error) {
    console.error("Error creating transaction:", error)
    throw new Error("Failed to create transaction")
  }

  // Update account balance
  const { error: balanceError } = await supabase.rpc("update_account_balance", {
    p_account_id: accountId,
    p_amount: isIncome ? amount : -amount,
  })

  if (balanceError) {
    console.error("Error updating account balance:", balanceError)
    // Consider rolling back the transaction here
  }

  // Revalidate transactions page
  revalidatePath("/transactions")

  return data[0]
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }
  
  // Ensure all static categories exist in the database
  const { ensureStaticCategories } = await import("./categories")
  await ensureStaticCategories()

  // Get original transaction to calculate balance adjustment
  const { data: originalTransaction, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !originalTransaction) {
    throw new Error("Transaction not found or access denied")
  }

  // Extract form data - only include fields that exist in the database
  const description = formData.get("description") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const isIncome = formData.get("is_income") === "true"
  const accountId = formData.get("account_id") as string
  const categoryId = formData.get("category_id") as string
  const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0]

  // Validate required fields
  if (!description || isNaN(amount) || !accountId) {
    throw new Error("Description, amount, and account are required")
  }

  // Verify account belongs to user if it's changed
  if (accountId !== originalTransaction.account_id) {
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .single()

    if (accountError || !account) {
      throw new Error("Invalid account or account does not belong to user")
    }
  }
  
  // Check if we need to use a default category
  let useCategoryId = categoryId;
  
  // If no category is provided
  if (!categoryId) {
    // Find an appropriate default category based on transaction type
    const defaultCategoryName = isIncome ? "Other Income" : "Other";
    
    // Check if the default category exists
    const { data: defaultCategory, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", defaultCategoryName)
      .eq("is_income", isIncome)
      .eq("user_id", user.id)
      .single();
      
    if (categoryError || !defaultCategory) {
      console.error("Error finding default category:", categoryError);
      throw new Error("Could not find an appropriate category for this transaction");
    }
    
    useCategoryId = defaultCategory.id;
  }

  // Calculate balance adjustments
  const originalImpact = originalTransaction.is_income ? originalTransaction.amount : -originalTransaction.amount
  const newImpact = isIncome ? amount : -amount

  // Update transaction with only the fields that exist in the database
  const { data, error } = await supabase
    .from("transactions")
    .update({
      description,
      amount,
      is_income: isIncome,
      account_id: accountId,
      category_id: useCategoryId,
      date: date
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(`
      *,
      account:accounts(id, name, type, institution)
    `)

  if (error) {
    console.error("Error updating transaction:", error)
    throw new Error("Failed to update transaction")
  }

  // Handle account balance updates
  if (originalTransaction.account_id === accountId) {
    // Same account, just update the difference
    const balanceAdjustment = newImpact - originalImpact

    if (balanceAdjustment !== 0) {
      const { error: accountError } = await supabase.rpc("update_account_balance", {
        p_account_id: accountId,
        p_amount: balanceAdjustment,
      })

      if (accountError) {
        console.error("Error updating account balance:", accountError)
      }
    }
  } else {
    // Different account, update both old and new accounts
    // Reverse the effect on the old account
    const { error: oldAccountError } = await supabase.rpc("update_account_balance", {
      p_account_id: originalTransaction.account_id,
      p_amount: -originalImpact,
    })

    if (oldAccountError) {
      console.error("Error updating old account balance:", oldAccountError)
    }

    // Apply the effect to the new account
    const { error: newAccountError } = await supabase.rpc("update_account_balance", {
      p_account_id: accountId,
      p_amount: newImpact,
    })

    if (newAccountError) {
      console.error("Error updating new account balance:", newAccountError)
    }
  }

  // Revalidate transactions page
  revalidatePath("/transactions")
  revalidatePath(`/transactions/${id}`)

  return data[0]
}

export async function deleteTransaction(id: string) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  // Get transaction details before deletion to update account balance
  const { data: transaction, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !transaction) {
    throw new Error("Transaction not found or access denied")
  }

  // Delete transaction
  const { error } = await supabase.from("transactions").delete().eq("id", id)

  if (error) {
    console.error("Error deleting transaction:", error)
    throw new Error("Failed to delete transaction")
  }

  // Update account balance (reverse the transaction effect)
  const balanceAdjustment = transaction.is_income ? -transaction.amount : transaction.amount

  const { error: accountError } = await supabase.rpc("update_account_balance", {
    p_account_id: transaction.account_id,
    p_amount: balanceAdjustment,
  })

  if (accountError) {
    console.error("Error updating account balance:", accountError)
  }

  // Revalidate transactions page
  revalidatePath("/transactions")

  return { success: true }
}

export async function getRecentTransactions(limit = 5) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      account:accounts(id, name, type, institution),
      category:categories(id, name, color, icon, is_income)
    `)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching recent transactions:", error)
    return []
  }

  return data
}

export async function getTransactionStats(period: "week" | "month" | "year" = "month") {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      transactionCount: 0,
      averageTransaction: 0,
    }
  }

  // Calculate date range based on period
  const now = new Date()
  let startDate: Date

  if (period === "week") {
    // Start from the beginning of the week (Sunday)
    const day = now.getDay() // 0 = Sunday, 6 = Saturday
    startDate = new Date(now)
    startDate.setDate(now.getDate() - day) // Go back to the start of the week
    startDate.setHours(0, 0, 0, 0) // Start of the day
  } else if (period === "month") {
    // Start from the beginning of the month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    // Start from the beginning of the year
    startDate = new Date(now.getFullYear(), 0, 1)
  }

  // Format date for SQL query
  const startDateStr = startDate.toISOString().split("T")[0]

  // Get all transactions in the period
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDateStr)
    .order("date", { ascending: false })

  if (error) {
    console.error("Error fetching transaction stats:", error)
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      transactionCount: 0,
      averageTransaction: 0,
    }
  }

  // Calculate statistics
  const totalIncome = data
    .filter((t) => t.is_income)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = data
    .filter((t) => !t.is_income)
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    totalIncome,
    totalExpenses,
    netIncome: totalIncome - totalExpenses,
    transactionCount: data.length,
    averageTransaction: data.length > 0 ? data.reduce((sum, t) => sum + t.amount, 0) / data.length : 0,
  }
}

// Interface for monthly income/expense data
interface MonthlyIncomeExpense {
  month: string;
  income: number;
  expenses: number;
}

// Interface for combined transaction data
interface CombinedTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  is_income: boolean;
  category?: any;
  account?: any;
  source_type: 'transaction' | 'income' | 'expense';
  [key: string]: any; // Allow additional properties
}

// Get monthly income and expense data for the past 12 months
// Get combined transactions from both income sources and expenses
export async function getCombinedTransactions(): Promise<CombinedTransaction[]> {
  try {
    // Get transactions from the transactions table
    const regularTransactions = await getTransactions()
    
    // Get income sources
    const incomeSources = await getIncomeSources().catch(() => [])
    
    // Get expenses
    const expenses = await getExpenses().catch(() => [])
    
    // Map income sources to the combined transaction format
    const incomeTransactions = incomeSources.map(income => ({
      id: income.id,
      description: income.name,
      amount: income.amount,
      date: income.created_at,
      is_income: true,
      category: {
        name: income.type,
        color: '#22c55e', // Green color for income
        is_income: true
      },
      account: income.account_id ? { id: income.account_id } : null,
      source_type: 'income' as const,
      frequency: income.frequency,
      ...income
    }))
    
    // Map expenses to the combined transaction format
    const expenseTransactions = expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      date: expense.spent_at,
      is_income: false,
      category: expense.category,
      category_id: expense.category_id || expense.category, // Include category_id from expense
      account: expense.account,
      source_type: 'expense' as const,
      merchant_name: expense.merchant_name,
      ...expense
    }))
    
    // Map regular transactions to ensure consistent format
    const formattedRegularTransactions = regularTransactions.map(transaction => ({
      ...transaction,
      source_type: 'transaction' as const
    }))
    
    // Combine all transactions
    const allTransactions = [
      ...formattedRegularTransactions,
      ...incomeTransactions,
      ...expenseTransactions
    ]
    
    // Sort by date (most recent first)
    return allTransactions.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (error) {
    console.error("Error fetching combined transactions:", error)
    return []
  }
}

export async function getMonthlyIncomeExpenseData(): Promise<MonthlyIncomeExpense[]> {
  const supabase = await createServerSupabaseClient()
  const user = await getAuthenticatedUser()

  if (!user) {
    return []
  }

  // Calculate date range for the past 12 months
  const now = new Date()
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of current month
  const startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1) // First day of the same month last year

  // Format dates for SQL query
  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = endDate.toISOString().split("T")[0]

  // Get all transactions in the period
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDateStr)
    .lte("date", endDateStr)
    .order("date", { ascending: true })

  if (error) {
    console.error("Error fetching monthly income/expense data:", error)
    return []
  }

  // Group transactions by month and calculate totals
  const monthlyData: Record<string, MonthlyIncomeExpense> = {}
  
  // Initialize all months in the past year to ensure we have data for every month
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const monthKey = monthDate.toISOString().substring(0, 7) // YYYY-MM format
    const monthName = monthDate.toLocaleString('default', { month: 'short' })
    monthlyData[monthKey] = { month: monthName, income: 0, expenses: 0 }
  }

  // Aggregate transaction data by month
  data.forEach(transaction => {
    const monthKey = transaction.date.substring(0, 7) // YYYY-MM format
    if (monthlyData[monthKey]) {
      if (transaction.is_income) {
        monthlyData[monthKey].income += transaction.amount
      } else {
        monthlyData[monthKey].expenses += transaction.amount
      }
    }
  })

  // Convert to array and sort by month
  return Object.entries(monthlyData)
    .map(([key, value]) => ({
      month: value.month,
      income: value.income,
      expenses: value.expenses
    }))
    .sort((a, b) => {
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
    })
}

// Interface for financial calendar data
export interface FinancialCalendarData {
  date: string
  income?: number
  expenses?: number
  events?: Array<{
    id: string
    title: string
    amount: number
    type: "income" | "expense"
  }>
}

export async function getFinancialCalendarData(): Promise<FinancialCalendarData[]> {
  try {
    // Get combined transactions from income sources and expenses
    const combinedTransactions = await getCombinedTransactions()
    
    // Group transactions by date
    const calendarData: Record<string, FinancialCalendarData> = {}
    
    combinedTransactions.forEach(transaction => {
      // Format date as YYYY-MM-DD
      const dateKey = new Date(transaction.date).toISOString().split('T')[0]
      
      // Initialize the date entry if it doesn't exist
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = {
          date: dateKey,
          income: 0,
          expenses: 0,
          events: []
        }
      }
      
      // Add transaction to the appropriate category
      if (transaction.is_income) {
        calendarData[dateKey].income = (calendarData[dateKey].income || 0) + transaction.amount
      } else {
        calendarData[dateKey].expenses = (calendarData[dateKey].expenses || 0) + transaction.amount
      }
      
      // Add event details
      calendarData[dateKey].events?.push({
        id: transaction.id,
        title: transaction.description,
        amount: transaction.amount,
        type: transaction.is_income ? "income" : "expense"
      })
    })
    
    // Convert to array
    return Object.values(calendarData)
  } catch (error) {
    console.error("Error fetching financial calendar data:", error)
    return []
  }
}
