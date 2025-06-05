"use server"

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { fetchReportData } from './fetch-report-data';

// Define interfaces for Net Worth report data structures
interface Asset {
  name: string;
  category: string; // Typically the 'type' from the accounts table (e.g., 'checking', 'savings')
  value: number;    // The monetary value of the asset
  [key: string]: any; // Allow other properties if any, like 'id'
}

interface Liability {
  name: string;
  category: string; // Typically the 'type' from the accounts table (e.g., 'credit_card', 'loan')
  amount: number;   // The monetary amount of the liability
  [key: string]: any; // Allow other properties if any, like 'id'
}

interface NetWorthReportDataType {
  assets: Asset[];
  liabilities: Liability[];
  totalAssets?: number;
  totalLiabilities?: number;
  netWorth?: number;
  timeRange?: { start: string; end: string };
  [key: string]: any; // Allow other dynamic properties returned by fetchReportData
}
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/auth"
import { format } from "date-fns"
import { revalidatePath } from "next/cache"
import { fetchIncomeData, fetchExpenseData, fetchDebtData, fetchSubscriptionData, fetchReportData as fetchReportDataFields } from "./report-data-provider"
import { PostgrestError } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import { generateReportByFormat } from "@/lib/report-generators-updated"

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
  | 'subscriptions' 
  | 'custom'
  | 'debt'
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
//     console.warn(`
// ==========================================================================
// REPORTS TABLE MISSING
// ==========================================================================
// The reports table does not exist in your database. Please run the migration
// script to create it:

// Option 1: Using the Supabase Dashboard (Recommended)
// 1. Log in to your Supabase dashboard
// 2. Navigate to the SQL Editor
// 3. Create a new query
// 4. Copy and paste the contents of 'migrations/create_reports_table.sql'
// 5. Run the query

// Option 2: Using the Migration Script
// Run: node scripts/run-reports-migration.js

// For more information, see README-REPORTS.md
// ==========================================================================
//     `)
    
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

// Ensure reports storage bucket exists with proper RLS policies
async function ensureReportsStorageBucket() {
  try {
    // Use admin client to bypass RLS policies
    const adminClient = await createAdminSupabaseClient()
    
    if (!adminClient) {
      console.warn('Warning: Failed to create admin client for storage setup')
      return false
    }
    
    // Check if the reports bucket already exists
    const { data: buckets, error: bucketsError } = await adminClient.storage.listBuckets()
    
    if (bucketsError) {
      console.warn('Warning: Error listing storage buckets:', bucketsError)
      return false
    }
    
    const reportsBucketExists = buckets.some(bucket => bucket.name === 'reports')
    
    if (!reportsBucketExists) {
      // Create the reports bucket with admin client
      const { error: createError } = await adminClient.storage.createBucket('reports', {
        public: false,
        fileSizeLimit: 20971520, // 20MB
        allowedMimeTypes: [
          'application/json',
          'application/pdf',
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      })
      
      if (createError) {
        console.warn('Warning: Error creating reports bucket:', createError)
        return false
      }
      
      // Execute the SQL function to set up proper RLS policies
      // @ts-ignore - TypeScript error with rpc typing
      const { error: rpcError } = await adminClient.rpc('create_reports_bucket_with_policies')
      
      if (rpcError) {
        console.warn('Warning: Error setting up reports bucket policies:', rpcError)
      }
    }
    
    return true
  } catch (error) {
    console.warn('Warning: Error setting up reports storage bucket:', error)
    // Continue execution - we'll handle failures gracefully
    return false
  }
}

// Generate the actual report file
export async function generateReportFile(report: Report): Promise<string> {
  console.log('generateReportFile called with report:', JSON.stringify(report, null, 2).substring(0, 500));

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    console.error("Failed to initialize Supabase client in generateReportFile");
    throw new Error("Failed to initialize Supabase client");
  }

  await ensureReportsStorageBucket();
  console.log('Ensured reports storage bucket exists.');

  let userId = report.user_id;
  if (!userId || userId === 'default-user') {
    try {
      const user = await getAuthenticatedUser();
      if (user && user.id) {
        userId = user.id;
        console.log('Authenticated user ID obtained:', userId);
      } else {
        console.error('User not authenticated, cannot generate report.');
        throw new Error('User not authenticated');
      }
    } catch (error) {
      console.error('Authentication error in generateReportFile:', error);
      throw new Error('Authentication required to generate reports');
    }
  } else {
    console.log('Using provided user ID for report:', userId);
  }
  
  if (!userId) {
    console.error('User ID is null or undefined after authentication check.');
    throw new Error('User ID could not be determined.');
  }

  try {
    let data: any[] = [];
    const timeFilter = getTimeRangeFilter(report.time_range);
    console.log(`Time filter generated for range "${report.time_range}":`, timeFilter);

    switch (report.type) {
      case 'income-sources':
        try {
          const incomeSourcesData = await fetchIncomeData(timeFilter);
          console.log('Raw income sources data:', JSON.stringify(incomeSourcesData, null, 2).substring(0, 500));
          if (incomeSourcesData && Array.isArray(incomeSourcesData)) {
            data = incomeSourcesData;
            console.log(`Income sources data has ${incomeSourcesData.length} items.`);
          } else {
            console.warn('Income sources data is not in expected array format:', typeof incomeSourcesData, incomeSourcesData);
            data = []; 
          }
        } catch (error) {
          console.error('Error fetching income sources data:', error);
          data = []; 
        }
        break;
        
      case 'expense-trends':
        try {
          const expenseData = await fetchExpenseData(timeFilter);
          console.log('Raw expense data for trends report:', JSON.stringify(expenseData, null, 2).substring(0, 500));
          if (expenseData && Array.isArray(expenseData)) {
            data = expenseData;
            console.log(`Expense data for trends report has ${expenseData.length} items.`);
          } else {
            console.warn('Expense trends data is not in expected array format:', typeof expenseData, expenseData);
            data = []; 
          }
        } catch (error) {
          console.error('Error fetching expense data for trends report:', error);
          data = []; 
        }
        break;
      
      case 'debt-analysis':
        try {
          const debtData = await fetchDebtData();
          console.log('Raw debt data:', JSON.stringify(debtData, null, 2).substring(0, 500));
          if (debtData && Array.isArray(debtData)) {
            data = debtData;
            console.log(`Debt data has ${debtData.length} items.`);
          } else {
            console.warn('Debt data is not in expected array format:', typeof debtData, debtData);
            data = [];
          }
        } catch (error) {
          console.error('Error fetching debt data:', error);
          data = [];
        }
        break;
        
      case 'net-worth':
        try {
          console.log(`Fetching net-worth report data directly for type: ${report.type}`);
          // Call the main fetchReportData which now handles 'net-worth' specifically
          const netWorthReportData = await fetchReportData(report.type as ReportType, report.time_range as TimeRange) as NetWorthReportDataType;
          console.log('Raw net-worth data from fetchReportData:', JSON.stringify(netWorthReportData, null, 2).substring(0, 500));
          // The prepareReportData function expects an array of objects.
          // For net-worth, we need to decide how to structure this. 
          // Let's pass assets and liabilities as separate arrays within an object, 
          // or combine them if prepareReportData can handle it.
          // For now, let's assume prepareReportData will be updated or can handle this structure.
          if (netWorthReportData && typeof netWorthReportData === 'object' && ('assets' in netWorthReportData || 'liabilities' in netWorthReportData)) {
             // We need to transform this into a single array for generateReportByFormat
            // which expects data: any[].
            // Let's combine assets and liabilities into a single list for the report,
            // distinguishing them by a 'record_type' field.
            type CombinedEntry = (Asset | Liability) & { record_type: 'Asset' | 'Liability' };
            const combinedData: CombinedEntry[] = [];
            if (Array.isArray(netWorthReportData.assets)) {
              netWorthReportData.assets.forEach((asset: Asset) => combinedData.push({ ...asset, record_type: 'Asset' }));
            }
            if (Array.isArray(netWorthReportData.liabilities)) {
              netWorthReportData.liabilities.forEach((liability: Liability) => combinedData.push({ ...liability, record_type: 'Liability' }));
            }
            data = combinedData;
            console.log(`Processed net-worth data has ${data.length} combined items.`);
          } else {
            console.warn('Net-worth data is not in the expected object format with assets/liabilities:', netWorthReportData);
            data = [];
          }
        } catch (error) {
          console.error('Error fetching net-worth data in generateReportFile:', error);
          data = [];
        }
        break;

      case 'subscriptions':
        try {
          const subscriptionData = await fetchSubscriptionData();
          console.log('Raw subscription data:', JSON.stringify(subscriptionData, null, 2).substring(0, 500));
          if (subscriptionData && Array.isArray(subscriptionData)) {
            data = subscriptionData;
            console.log(`Subscription data has ${subscriptionData.length} items.`);
          } else {
            console.warn('Subscription data is not in expected array format:', typeof subscriptionData, subscriptionData);
            data = [];
          }
        } catch (error) {
          console.error('Error fetching subscription data:', error);
          data = [];
        }
        break;

      default:
        try {
          const genericData = await fetchReportDataFields(report.type, report.time_range);
          console.log(`Raw data for ${report.type}:`, JSON.stringify(genericData, null, 2).substring(0, 500));
          if (genericData && Array.isArray(genericData)) {
            data = genericData;
            console.log(`Generic data for ${report.type} has ${genericData.length} items.`);
          } else if (report.type === 'overview' && 
                     genericData && 
                     typeof genericData === 'object' &&
                     'income' in genericData && 
                     'expenses' in genericData && 
                     'debts' in genericData && 
                     'subscriptions' in genericData) {
            // Type assertion for clarity, assuming genericData matches the expected overview structure
            const overviewData = genericData as {
              income: any[];
              expenses: any[];
              debts: any[];
              subscriptions: any[];
              // timeRange is also present but not directly used to form the 'data' array here
            };
            
            data = [
              ...(overviewData.income || []).map(item => ({ ...item, reportDataType: 'Income' })),
              ...(overviewData.expenses || []).map(item => ({ ...item, reportDataType: 'Expense' })),
              ...(overviewData.debts || []).map(item => ({ ...item, reportDataType: 'Debt' })),
              ...(overviewData.subscriptions || []).map(item => ({ ...item, reportDataType: 'Subscription' })),
            ];
            console.log(`Processed overview data for ${report.type}. Total items: ${data.length}`);
          } else {
            // Log the actual structure if it's an object but not the overview format we expect
            const logData = typeof genericData === 'object' ? JSON.stringify(genericData, null, 2).substring(0, 500) : genericData;
            console.warn(`${report.type} data is not in expected array format or overview object format:`, typeof genericData, logData);
            data = [];
          }
        } catch (error) {
          console.error(`Error fetching data for ${report.type}:`, error);
          data = [];
        }
        break;
    }

    if (!Array.isArray(data)) {
        console.warn(`Data for report type ${report.type} was not an array after fetching, coercing to empty. Original data:`, JSON.stringify(data, null, 2).substring(0,500));
        data = [];
    }
    
    console.log(`Final data array for ${report.type} (length ${data.length}) being passed to generateReportByFormat:`, JSON.stringify(data, null, 2).substring(0,500));

    const filename = `${report.type}_${report.format}_${uuidv4()}.${getFileExtension(report.format)}`;
    const filePath = `reports/${userId}/${filename}`;

    const reportBlob: Blob = await generateReportByFormat(data, report);
    const fileBuffer = await reportBlob.arrayBuffer();
    const actualContentType = reportBlob.type;
    
    console.log(`Generated report file for ${filePath}. ContentType: ${actualContentType}, Buffer size: ${fileBuffer?.byteLength}`);

    const adminClient = await createAdminSupabaseClient();
    let uploadSuccessful = false;
    let publicUrl: string | null = null;

    if (adminClient) {
      try {
        console.log(`Attempting to upload ${filePath} with admin client.`);
        const { error: adminUploadError } = await adminClient.storage
          .from('reports')
          .upload(filePath, fileBuffer, {
            contentType: actualContentType,
            cacheControl: '3600',
            upsert: true
          });

        if (adminUploadError) {
          console.error(`Admin client upload error for ${filePath}:`, adminUploadError);
          if (adminUploadError.message && adminUploadError.message.includes('<html>')) {
            console.error('Admin client received HTML response, possibly an auth or service issue with storage.');
          }
        } else {
          uploadSuccessful = true;
          console.log(`Report file ${filePath} uploaded successfully with admin client.`);
          const { data: urlDataResult } = await adminClient.storage.from('reports').getPublicUrl(filePath);
          publicUrl = urlDataResult?.publicUrl || null;
        }
      } catch (e) {
        console.error(`Exception during admin client upload for ${filePath}:`, e);
      }
    }

    if (!uploadSuccessful) {
      console.log(`Admin client upload failed or not available for ${filePath}. Falling back to regular client.`);
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, fileBuffer, {
          contentType: actualContentType,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error(`Regular client upload error for ${filePath}:`, uploadError);
        if (uploadError.message && uploadError.message.includes('new row violates row-level security policy')) {
            console.error("RLS policy violation detected during fallback upload. This might indicate an issue with user permissions or bucket policies.");
        }
        throw new Error(`Failed to upload report file ${filePath} with regular client: ${uploadError.message}`);
      }
      console.log(`Report file ${filePath} uploaded successfully with regular client.`);
      const { data: urlDataResult } = await supabase.storage.from('reports').getPublicUrl(filePath);
      publicUrl = urlDataResult?.publicUrl || null;
    }
    
    if (!publicUrl) {
      console.error(`Failed to get public URL for report: ${filePath}`);
      throw new Error(`Failed to retrieve public URL for the report file ${filePath}.`);
    }
    
    console.log(`Report ${filePath} generated and uploaded. Public URL: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.error("Error in generateReportFile function:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate report file (original error: ${error.message})`);
    }
    throw new Error("Failed to generate report file due to an unexpected error.");
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
