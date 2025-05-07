"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { format } from "date-fns"
import { PostgrestError } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Types for report data
export type ReportType = 
  | 'overview' 
  | 'income-expense' 
  | 'net-worth' 
  | 'investments' 
  | 'budget-analysis' 
  | 'spending-categories' 
  | 'income-sources' 
  | 'expense-trends' 
  | 'savings-goals' 
  | 'debt-analysis' 
  | 'investment-performance' 
  | 'custom'
export type ReportFormat = 'pdf' | 'csv' | 'excel'
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'ytd' | 'all' | 'custom'

export type ReportRequest = {
  type: ReportType
  format: ReportFormat
  timeRange: TimeRange
  title?: string
  description?: string
  customDateRange?: {
    startDate: string
    endDate: string
  }
  comparisonType?: 'previous-period' | 'year-over-year' | 'custom' | 'none'
  comparisonTimeRange?: TimeRange
  comparisonCustomDateRange?: {
    startDate: string
    endDate: string
  }
  dataFilters?: {
    categories?: string[]
    accounts?: string[]
    tags?: string[]
    minAmount?: number
    maxAmount?: number
  }
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'category' | 'account' | 'tag'
  sortBy?: 'date' | 'amount' | 'name' | 'category'
  sortDirection?: 'asc' | 'desc'
  includeCharts?: boolean
  chartTypes?: ('bar' | 'line' | 'pie' | 'area' | 'scatter')[] 
  customFields?: Record<string, any>
}

export type Report = {
  id: string
  user_id: string
  title: string
  description: string | null
  type: ReportType
  format: ReportFormat
  time_range: TimeRange
  file_url: string | null
  created_at: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
}

// Ensure reports table exists
async function ensureReportsTableExists() {
  const supabase = await createServerSupabaseClient()
  
  if (!supabase) {
    throw new Error("Failed to initialize Supabase client")
  }
  
  try {
    // Check if reports table exists
    const { error: tableCheckError } = await supabase
      .from('reports')
      .select('id')
      .limit(1)
      .throwOnError()
    
    if (!tableCheckError) {
      // Table exists, no need to create it
      return true
    }
  } catch (error: unknown) {
    const pgError = error as PostgrestError
    if (pgError.code !== '42P01') {
      // If it's not a "table doesn't exist" error, rethrow
      throw error
    }
    
    // Table doesn't exist, inform about the migration script
    console.warn(`
==========================================================================
REPORTS TABLE MISSING
==========================================================================
The reports table does not exist in your database. Please run the migration
script to create it:

Option 1: Using the Supabase Dashboard (Recommended)
1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of 'migrations/create_reports_table.sql'
5. Run the query

Option 2: Using the Migration Script
Run: node scripts/run-reports-migration.js

For more information, see README-REPORTS.md
==========================================================================
    `)
    
    // Create a temporary table in memory to handle operations until the real table is created
    global._tempReportsTable = global._tempReportsTable || []
    
    return true
  }
  
  return true
}

// Get all reports for the current user
export async function getReports() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }
    
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    // Ensure reports table exists
    await ensureReportsTableExists()

    // Check if we're using a temporary in-memory table
    if (global._tempReportsTable) {
      return global._tempReportsTable.filter(report => report.user_id === user.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching reports:", error)
      return []
    }

    return data as Report[]
  } catch (error: unknown) {
    console.error("Unexpected error in getReports:", error)
    return []
  }
}

// Get a specific report by ID
export async function getReportById(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }
    
    const user = await getAuthenticatedUser()

    if (!user) {
      return null
    }

    // Ensure reports table exists
    await ensureReportsTableExists()

    // Check if we're using a temporary in-memory table
    if (global._tempReportsTable) {
      return global._tempReportsTable.find(report => report.id === id && report.user_id === user.id) || null;
    }

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error("Error fetching report:", error)
      return null
    }

    return data as Report
  } catch (error: unknown) {
    console.error("Unexpected error in getReportById:", error)
    return null
  }
}

// Generate a new report
export async function generateReport(reportRequest: ReportRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }
    
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    const { type, format, timeRange, title, description } = reportRequest

    // Default title if not provided
    const reportTitle = title || `${formatReportType(type)} Report - ${format.toUpperCase()}`

    // Ensure reports table exists
    await ensureReportsTableExists()

    // Create a new report record
    const newReport: Report = {
      id: uuidv4(),
      user_id: user.id,
      title: reportTitle,
      description: description || null,
      type,
      format,
      time_range: timeRange,
      file_url: null,
      created_at: new Date().toISOString(),
      status: 'pending',
      error_message: null
    };

    // Check if we're using a temporary in-memory table
    if (global._tempReportsTable) {
      global._tempReportsTable.push(newReport);
      
      // Start the report generation process
      setTimeout(async () => {
        await processReport(newReport.id)
      }, 1000)
      
      return newReport;
    }

    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          user_id: user.id,
          title: reportTitle,
          description,
          type,
          format,
          time_range: timeRange,
          status: 'pending'
        }
      ])
      .select()

    if (error) {
      console.error("Error creating report:", error)
      throw new Error("Failed to create report")
    }

    const report = data[0] as Report
    
    // Start the report generation process
    // In a production environment, this would be handled by a background job
    setTimeout(async () => {
      await processReport(report.id)
    }, 1000)

    return report
  } catch (error: unknown) {
    console.error("Error in generateReport:", error)
    throw error
  }
}

// Process a report
async function processReport(reportId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }
    
    // Check if we're using a temporary in-memory table
    if (global._tempReportsTable) {
      const reportIndex = global._tempReportsTable.findIndex(r => r.id === reportId);
      if (reportIndex >= 0) {
        // Update status to processing
        global._tempReportsTable[reportIndex].status = 'processing';
        
        // Get report details
        const report = global._tempReportsTable[reportIndex];
        
        // Generate the actual report based on type and format
        try {
          const fileUrl = await generateReportFile(report);
          
          // Update report with completed status and file URL
          global._tempReportsTable[reportIndex].status = 'completed';
          global._tempReportsTable[reportIndex].file_url = fileUrl;
        } catch (error) {
          global._tempReportsTable[reportIndex].status = 'failed';
          global._tempReportsTable[reportIndex].error_message = 
            `Error processing report: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
      return;
    }
    
    // Update status to processing
    await supabase
      .from('reports')
      .update({ status: 'processing' })
      .eq('id', reportId)
    
    // Get report details
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()
    
    if (reportError || !report) {
      throw new Error(`Report not found: ${reportError?.message || 'Unknown error'}`)
    }
    
    // Generate the actual report based on type and format
    const fileUrl = await generateReportFile(report)
    
    // Update report with completed status and file URL
    await supabase
      .from('reports')
      .update({ 
        status: 'completed',
        file_url: fileUrl,
      })
      .eq('id', reportId)
  } catch (error: unknown) {
    console.error("Error processing report:", error)
    
    // Check if we're using a temporary in-memory table
    if (global._tempReportsTable) {
      const reportIndex = global._tempReportsTable.findIndex(r => r.id === reportId);
      if (reportIndex >= 0) {
        global._tempReportsTable[reportIndex].status = 'failed';
        global._tempReportsTable[reportIndex].error_message = 
          `Error processing report: ${error instanceof Error ? error.message : String(error)}`;
      }
      return;
    }
    
    // Update report with failed status
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('reports')
      .update({ 
        status: 'failed',
        error_message: `Error processing report: ${error instanceof Error ? error.message : String(error)}`
      })
      .eq('id', reportId)
  }
}

// Generate the actual report file
async function generateReportFile(report: Report): Promise<string> {
  const supabase = await createServerSupabaseClient()
  
  if (!supabase) {
    throw new Error("Failed to initialize Supabase client")
  }
  
  try {
    // Fetch data based on report type and time range
    let data: any[] = []
    const timeFilter = getTimeRangeFilter(report.time_range)
    
    switch (report.type) {
      case 'overview':
        // Fetch overview data (transactions, income, expenses, net worth)
        try {
          const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100)
          
          if (!transactionsError && transactions) {
            data = transactions
          }
        } catch (error) {
          console.log('Error fetching transactions, using empty data set')
        }
        break
        
      case 'income-expense':
        // Fetch income and expense data
        try {
          const { data: incomeExpense, error: incomeExpenseError } = await supabase
            .from('transactions')
            .select('*')
            .in('type', ['income', 'expense'])
            .order('created_at', { ascending: false })
            .limit(100)
          
          if (!incomeExpenseError && incomeExpense) {
            data = incomeExpense
          }
        } catch (error) {
          console.log('Error fetching income/expense data, using empty data set')
        }
        break
        
      case 'net-worth':
        // Fetch net worth data
        try {
          const { data: assets, error: assetsError } = await supabase
            .from('assets')
            .select('*')
          
          const { data: liabilities, error: liabilitiesError } = await supabase
            .from('liabilities')
            .select('*')
          
          if ((!assetsError || !liabilitiesError) && (assets || liabilities)) {
            data = [...(assets || []), ...(liabilities || [])]
          }
        } catch (error) {
          console.log('Error fetching net worth data, using empty data set')
        }
        break
        
      case 'investments':
        // Fetch investment data
        try {
          const { data: investments, error: investmentsError } = await supabase
            .from('investments')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (!investmentsError && investments) {
            data = investments
          }
        } catch (error) {
          console.log('Error fetching investment data, using empty data set')
        }
        break
    }
    
    // Create a unique filename
    const filename = `${report.type}_${report.format}_${uuidv4()}.${getFileExtension(report.format)}`
    
    // Prepare file path for storage
    const filePath = `reports/${report.user_id}/${filename}`
    
    // If we have real data, we would generate the file here and upload to storage
    // For demonstration purposes, we'll create a metadata file with report info
    const metadata = {
      report_id: report.id,
      report_type: report.type,
      report_format: report.format,
      time_range: report.time_range,
      generated_at: new Date().toISOString(),
      record_count: data.length,
      user_id: report.user_id
    }
    
    // Convert metadata to string
    const metadataStr = JSON.stringify(metadata, null, 2)
    
    // Upload metadata file to storage (in a real app, this would be the actual report file)
    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(filePath, metadataStr, {
        contentType: 'application/json',
        cacheControl: '3600'
      })
    
    if (uploadError) {
      console.error('Error uploading report metadata:', uploadError)
      throw new Error('Failed to upload report file')
    }
    
    // Get public URL for the file
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(filePath)
    
    if (!urlData || !urlData.publicUrl) {
      // If we can't get a public URL, use a placeholder
      return `https://storage.example.com/reports/${filename}?records=${data.length}`
    }
    
    return urlData.publicUrl
  } catch (error) {
    console.error("Error generating report file:", error)
    throw new Error("Failed to generate report file")
  }
}

// Delete a report
export async function deleteReport(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }
    
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // Ensure reports table exists
    await ensureReportsTableExists()

    // Check if we're using a temporary in-memory table
    if (global._tempReportsTable) {
      const initialLength = global._tempReportsTable.length;
      global._tempReportsTable = global._tempReportsTable.filter(
        report => !(report.id === id && report.user_id === user.id)
      );
      
      return { success: global._tempReportsTable.length < initialLength };
    }

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error("Error deleting report:", error)
      throw new Error("Failed to delete report")
    }

    return { success: true }
  } catch (error: unknown) {
    console.error("Error in deleteReport:", error)
    throw error
  }
}

// Helper functions
function formatReportType(type: ReportType): string {
  switch (type) {
    case 'overview':
      return 'Financial Overview'
    case 'income-expense':
      return 'Income & Expenses'
    case 'net-worth':
      return 'Net Worth'
    case 'investments':
      return 'Investment Performance'
    default:
      return String(type).charAt(0).toUpperCase() + String(type).slice(1).replace(/-/g, ' ')
  }
}

function getFileExtension(format: ReportFormat): string {
  switch (format) {
    case 'pdf':
      return 'pdf'
    case 'csv':
      return 'csv'
    case 'excel':
      return 'xlsx'
    default:
      return 'txt'
  }
}

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

// Add TypeScript declaration for global variable
declare global {
  var _tempReportsTable: Report[] | undefined;
}
