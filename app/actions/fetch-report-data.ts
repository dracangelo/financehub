"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { ReportType, TimeRange } from "./reports"

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
  let data: any[] = []
  
  try {
    switch (reportType) {
      case 'overview':
        // Fetch overview data (transactions, income, expenses, net worth)
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', timeFilter.start.toISOString())
          .lte('created_at', timeFilter.end.toISOString())
          .order('created_at', { ascending: false })
        
        if (!transactionsError && transactions) {
          data = transactions
        } else if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError)
        }
        break
        
      case 'income-expense':
        // Fetch income and expense data
        const { data: incomeExpense, error: incomeExpenseError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .in('type', ['income', 'expense'])
          .gte('created_at', timeFilter.start.toISOString())
          .lte('created_at', timeFilter.end.toISOString())
          .order('created_at', { ascending: false })
        
        if (!incomeExpenseError && incomeExpense) {
          data = incomeExpense
        } else if (incomeExpenseError) {
          console.error("Error fetching income/expense data:", incomeExpenseError)
        }
        break
        
      case 'net-worth':
        // Fetch net worth data (assets and liabilities)
        const { data: assets, error: assetsError } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', user.id)
        
        const { data: liabilities, error: liabilitiesError } = await supabase
          .from('liabilities')
          .select('*')
          .eq('user_id', user.id)
        
        if ((!assetsError || !liabilitiesError) && (assets || liabilities)) {
          data = [...(assets || []), ...(liabilities || [])]
        } else {
          if (assetsError) console.error("Error fetching assets:", assetsError)
          if (liabilitiesError) console.error("Error fetching liabilities:", liabilitiesError)
        }
        break
        
      case 'investments':
        // Fetch investment data
        const { data: investments, error: investmentsError } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (!investmentsError && investments) {
          data = investments
        } else if (investmentsError) {
          console.error("Error fetching investment data:", investmentsError)
        }
        break
    }
    
    return data
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
