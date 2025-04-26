"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { PostgrestError } from "@supabase/supabase-js"
import { Report } from "./reports"

// Types for analytics calendar data
export type AnalyticsEventType = "income" | "expense" | "report" | "transaction"

export interface AnalyticsEvent {
  id: string
  title: string
  amount: number
  type: AnalyticsEventType
  date: string
  category?: string
  format?: string
  status?: string
}

export interface AnalyticsDayData {
  date: string
  income?: number
  expenses?: number
  reports?: Report[]
  events: AnalyticsEvent[]
}

// Get analytics calendar data for a specific month
export async function getAnalyticsCalendarData(year: number, month: number): Promise<AnalyticsDayData[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    // Calculate start and end dates for the requested month
    const targetDate = new Date(year, month - 1) // JavaScript months are 0-indexed
    const startDate = startOfMonth(targetDate)
    const endDate = endOfMonth(targetDate)
    
    // Format dates for database queries
    const startDateStr = format(startDate, "yyyy-MM-dd")
    const endDateStr = format(endDate, "yyyy-MM-dd")

    // Initialize the calendar data object
    const calendarData: Record<string, AnalyticsDayData> = {}

    // 1. Fetch transactions data
    try {
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select(`
          id, 
          description, 
          amount, 
          date, 
          type,
          category_id,
          categories:categories(id, name, color, icon)
        `)
        .eq("user_id", user.id)
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .order("date", { ascending: true })

      if (!transactionsError && transactions) {
        // Process transactions
        transactions.forEach(transaction => {
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
          if (transaction.type === 'income') {
            calendarData[dateKey].income = (calendarData[dateKey].income || 0) + transaction.amount
          } else {
            calendarData[dateKey].expenses = (calendarData[dateKey].expenses || 0) + transaction.amount
          }
          
          // Get category name if available
          let categoryName: string | undefined = undefined;
          if (transaction.categories && Array.isArray(transaction.categories) && transaction.categories.length > 0) {
            categoryName = transaction.categories[0]?.name;
          }
          
          // Add event details
          calendarData[dateKey].events.push({
            id: transaction.id,
            title: transaction.description,
            amount: transaction.amount,
            type: transaction.type as AnalyticsEventType,
            date: dateKey,
            category: categoryName
          })
        })
      }
    } catch (error) {
      console.log("Error fetching transactions:", error)
      // Continue execution even if this fails
    }

    // 2. Fetch reports data
    try {
      // Check if reports table exists
      try {
        const { data: reports, error: reportsError } = await supabase
          .from("reports")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: true })
        
        if (!reportsError && reports) {
          // Process reports
          reports.forEach(report => {
            const reportDate = new Date(report.created_at)
            const dateKey = reportDate.toISOString().split('T')[0]
            
            // Initialize the date entry if it doesn't exist
            if (!calendarData[dateKey]) {
              calendarData[dateKey] = {
                date: dateKey,
                income: 0,
                expenses: 0,
                reports: [],
                events: []
              }
            }
            
            // Add report to the day's reports
            calendarData[dateKey].reports = [...(calendarData[dateKey].reports || []), report]
            
            // Add report as an event
            calendarData[dateKey].events.push({
              id: report.id,
              title: report.title,
              amount: 0, // Reports don't have amounts
              type: "report",
              date: dateKey,
              format: report.format,
              status: report.status
            })
          })
        }
      } catch (error: unknown) {
        // If reports table doesn't exist, use in-memory data
        if (global._tempReportsTable) {
          const reports = global._tempReportsTable.filter(report => {
            const reportDate = new Date(report.created_at)
            return reportDate >= startDate && reportDate <= endDate
          })
          
          reports.forEach(report => {
            const reportDate = new Date(report.created_at)
            const dateKey = reportDate.toISOString().split('T')[0]
            
            // Initialize the date entry if it doesn't exist
            if (!calendarData[dateKey]) {
              calendarData[dateKey] = {
                date: dateKey,
                income: 0,
                expenses: 0,
                reports: [],
                events: []
              }
            }
            
            // Add report to the day's reports
            calendarData[dateKey].reports = [...(calendarData[dateKey].reports || []), report]
            
            // Add report as an event
            calendarData[dateKey].events.push({
              id: report.id,
              title: report.title,
              amount: 0,
              type: "report",
              date: dateKey,
              format: report.format,
              status: report.status
            })
          })
        }
      }
    } catch (error) {
      console.log("Error fetching reports:", error)
      // Continue execution even if this fails
    }

    // If no data was found for the month, add some sample data for demonstration
    if (Object.keys(calendarData).length === 0) {
      // Add sample data for the current month
      const today = new Date()
      const todayStr = format(today, "yyyy-MM-dd")
      
      // Sample income
      calendarData[todayStr] = {
        date: todayStr,
        income: 2500,
        expenses: 1200,
        events: [
          {
            id: "sample-income-1",
            title: "Salary",
            amount: 2500,
            type: "income",
            date: todayStr,
            category: "Income"
          },
          {
            id: "sample-expense-1",
            title: "Rent",
            amount: 1200,
            type: "expense",
            date: todayStr,
            category: "Housing"
          }
        ]
      }
      
      // Sample report
      const reportDate = new Date(today)
      reportDate.setDate(today.getDate() - 2)
      const reportDateStr = format(reportDate, "yyyy-MM-dd")
      
      if (!calendarData[reportDateStr]) {
        calendarData[reportDateStr] = {
          date: reportDateStr,
          income: 0,
          expenses: 0,
          events: []
        }
      }
      
      calendarData[reportDateStr].events.push({
        id: "sample-report-1",
        title: "Monthly Financial Report",
        amount: 0,
        type: "report",
        date: reportDateStr,
        format: "pdf",
        status: "completed"
      })
    }

    // Convert to array and sort by date
    return Object.values(calendarData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  } catch (error) {
    console.error("Error in getAnalyticsCalendarData:", error)
    return []
  }
}

// Get analytics summary for dashboard
export async function getAnalyticsSummary() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return {
        totalReports: 0,
        recentReports: [],
        monthlyReportCount: []
      }
    }

    // Initialize summary data
    let totalReports = 0
    let recentReports: Report[] = []
    let monthlyReportCount: { month: string, count: number }[] = []

    // Get report count and recent reports
    try {
      // Check if reports table exists
      const { data: reports, error: reportsError } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)
      
      if (!reportsError && reports) {
        totalReports = reports.length
        recentReports = reports as Report[]
        
        // Get monthly report counts for the last 6 months
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), i)
          return {
            month: format(date, "MMM yyyy"),
            startDate: startOfMonth(date),
            endDate: endOfMonth(date),
            count: 0
          }
        })
        
        // Count reports for each month
        const { data: monthlyData, error: monthlyError } = await supabase
          .from("reports")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", last6Months[5].startDate.toISOString())
          .lte("created_at", last6Months[0].endDate.toISOString())
        
        if (!monthlyError && monthlyData) {
          monthlyData.forEach(report => {
            const reportDate = new Date(report.created_at)
            const monthIndex = last6Months.findIndex(month => 
              reportDate >= month.startDate && reportDate <= month.endDate
            )
            
            if (monthIndex !== -1) {
              last6Months[monthIndex].count++
            }
          })
          
          monthlyReportCount = last6Months.map(month => ({
            month: month.month,
            count: month.count
          })).reverse() // Show oldest to newest
        }
      } else if (global._tempReportsTable) {
        // Use in-memory data if table doesn't exist
        totalReports = global._tempReportsTable.length
        recentReports = global._tempReportsTable
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
        
        // Get monthly report counts for the last 6 months
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), i)
          return {
            month: format(date, "MMM yyyy"),
            startDate: startOfMonth(date),
            endDate: endOfMonth(date),
            count: 0
          }
        })
        
        // Count reports for each month
        global._tempReportsTable.forEach(report => {
          const reportDate = new Date(report.created_at)
          const monthIndex = last6Months.findIndex(month => 
            reportDate >= month.startDate && reportDate <= month.endDate
          )
          
          if (monthIndex !== -1) {
            last6Months[monthIndex].count++
          }
        })
        
        monthlyReportCount = last6Months.map(month => ({
          month: month.month,
          count: month.count
        })).reverse() // Show oldest to newest
      }
    } catch (error) {
      console.log("Error fetching reports summary:", error)
      // Continue with default values
    }

    return {
      totalReports,
      recentReports,
      monthlyReportCount
    }
  } catch (error) {
    console.error("Error in getAnalyticsSummary:", error)
    return {
      totalReports: 0,
      recentReports: [],
      monthlyReportCount: []
    }
  }
}

// Add TypeScript declaration for global variable
declare global {
  var _tempReportsTable: Report[] | undefined;
}
