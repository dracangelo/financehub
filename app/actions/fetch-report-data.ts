"use server"

import { getAuthenticatedUser } from '@/lib/auth'
import { createServerSupabaseClient as createServerSupabaseClientHelper } from '@/lib/supabase/server'
import { ReportType, TimeRange } from "./reports"
import { formatCurrency } from '@/lib/utils'
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

// Create a type for our Supabase client
type SupabaseClient = ReturnType<typeof createClient<Database>>

// Define base types for our data
type BaseTransaction = {
  id: string;
  amount: string | number;
  date?: string;
  description?: string;
  user_id: string;
};

type Expense = BaseTransaction & {
  category_id?: string;
  category_name?: string;
  category_color?: string;
  expense_categories?: {
    id: string;
    name: string;
    color?: string;
  };
  name?: string;
};

type Income = BaseTransaction & {
  name: string;
  category_id?: string;
  category_name?: string;
  income_categories?: {
    id: string;
    name: string;
    color?: string;
  };
  start_date?: string;
};

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
  category?: string;
};

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
};

type CategoryData = {
  id: string;
  name: string;
  amount: number;
  color: string;
};

type ReportData = {
  totalExpenses: number;
  totalIncome: number;
  netIncome: number;
  monthlyData: MonthlyData[];
  categoryData: CategoryData[];
  recentTransactions: Transaction[];
};

// Helper function to get time range filter
function getTimeRangeFilter(timeRange: TimeRange): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  
  switch (timeRange) {
    case '7d':
      start.setDate(now.getDate() - 7)
      break
    case '30d':
      start.setDate(now.getDate() - 30)
      break
    case '90d':
      start.setDate(now.getDate() - 90)
      break
    case '1y':
      start.setFullYear(now.getFullYear() - 1)
      break
    case 'ytd':
      start.setMonth(0, 1) // January 1st of current year
      break
    case 'all':
    default:
      // Default to 1 year if no range is specified
      start.setFullYear(now.getFullYear() - 1)
  }
  
  return { start, end: now }
}

// Type definitions for report data - Using the ones defined at the top of the file





// Helper function to create a server-side Supabase client
async function createServerSupabaseClient() {
  return await createServerSupabaseClientHelper()
}

// Helper function to fetch overview data
async function fetchOverviewData(supabase: SupabaseClient, userId: string, timeFilter: { start: Date; end: Date }) {
  try {
    // Fetch expenses and income data in parallel
    const [expensesData, incomeData] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('date', timeFilter.start.toISOString())
        .lte('date', timeFilter.end.toISOString()),
      supabase
        .from('incomes')
        .select('*')
        .eq('user_id', userId)
        .gte('date', timeFilter.start.toISOString())
        .lte('date', timeFilter.end.toISOString())
    ]);

    const expenses = expensesData.data || [];
    const incomes = incomeData.data || [];

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
    const netIncome = totalIncome - totalExpenses;

    // Get recent transactions (last 5)
    const recentTransactions: Transaction[] = [
      ...expenses.map(exp => ({
        id: exp.id,
        type: 'expense' as const,
        amount: Number(exp.amount) || 0,
        date: exp.date || new Date().toISOString(),
        description: exp.description || 'Expense',
        category: exp.category_id
      })),
      ...incomes.map(inc => ({
        id: inc.id,
        type: 'income' as const,
        amount: Number(inc.amount) || 0,
        date: inc.date || new Date().toISOString(),
        description: inc.description || 'Income',
        category: inc.category_id
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Generate monthly data
    const monthlyData = getMonthlyData(expenses, incomes, timeFilter);
    
    // Get category data
    const categoryData = getCategoryData(expenses);

    return {
      totalExpenses,
      totalIncome,
      netIncome,
      monthlyData,
      categoryData,
      recentTransactions
    };
  } catch (error) {
    console.error('Error in fetchOverviewData:', error);
    throw error;
  }
}



// Helper function to generate monthly data
function getMonthlyData(
  expenses: any[],
  incomes: any[],
  timeFilter: { start: Date; end: Date }
): MonthlyData[] {
  const monthlyData: Record<string, MonthlyData> = {};
  const currentDate = new Date(timeFilter.start);
  const endDate = new Date(timeFilter.end);

  // Initialize all months in the range
  while (currentDate <= endDate) {
    const monthKey = currentDate.toISOString().slice(0, 7);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: `${monthName} ${year}`,
        income: 0,
        expenses: 0
      };
    }
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Process expenses
  expenses.forEach(exp => {
    if (!exp.date) return;
    const date = new Date(exp.date);
    const monthKey = date.toISOString().slice(0, 7);
    
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].expenses += Number(exp.amount) || 0;
    }
  });

  // Process incomes
  incomes.forEach(inc => {
    if (!inc.date) return;
    const date = new Date(inc.date);
    const monthKey = date.toISOString().slice(0, 7);
    
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].income += Number(inc.amount) || 0;
    }
  });

  return Object.values(monthlyData).sort((a, b) => {
    return new Date(a.month).getTime() - new Date(b.month).getTime();
  });
}

// Helper function to get category data from expenses
function getCategoryData(expenses: any[]): CategoryData[] {
  const categoryMap: Record<string, CategoryData> = {};

  expenses.forEach(exp => {
    try {
      // Handle both direct category properties and nested expense_categories object
      const categoryId = exp.category_id || exp.expense_categories?.id || 'uncategorized';
      const categoryName = exp.category_name || exp.expense_categories?.name || 'Uncategorized';
      const categoryColor = exp.category_color || exp.expense_categories?.color || getDefaultColorForCategory(categoryId);
      const amount = parseFloat(exp.amount) || 0;

      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          id: categoryId,
          name: categoryName,
          amount: 0,
          color: categoryColor
        };
      }

      categoryMap[categoryId].amount += amount;
    } catch (error) {
      console.error('Error processing expense category:', exp, error);
    }
  });

  return Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
}

// Generate a consistent color based on a string input
function getDefaultColorForCategory(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

// Main function to fetch report data
export async function fetchReportData(reportType: ReportType, timeRange: TimeRange) {
  try {
    // Create a server-side Supabase client
    const supabase = await createServerSupabaseClient();
    
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }
    
    // Get the authenticated user using the centralized auth function
    const user = await getAuthenticatedUser();
    
    if (!user) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    const userId = user.id;
    
    // Get the time range filter
    const timeFilter = getTimeRangeFilter(timeRange);
    
    // Route to the appropriate fetch function based on report type
    switch (reportType) {
      case 'overview':
        return await fetchOverviewData(supabase, userId, timeFilter);
      case 'income-expense':
        try {
          console.log('Fetching report data for period:', {
            reportType,
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
            userId
          });
          
          // Fetch income data with date range filtering
          const incomeQuery = await supabase
            .from('incomes')
            .select('*, income_categories!inner(*)')
            .eq('user_id', userId)
            .gte('start_date', timeFilter.start.toISOString())
            .lte('end_date', timeFilter.end.toISOString())
            .order('start_date', { ascending: false });

          if (incomeQuery.error) {
            console.error('Error fetching income data:', incomeQuery.error);
            throw incomeQuery.error;
          }
          console.log(`Fetched ${incomeQuery.data?.length || 0} income records`);

          // Fetch expense data with date range filtering
          const expensesQuery = await supabase
            .from('expenses')
            .select('*, expense_categories!inner(*)')
            .eq('user_id', userId)
            .gte('expense_date', timeFilter.start.toISOString())
            .lte('expense_date', timeFilter.end.toISOString())
            .order('expense_date', { ascending: false });
            
          if (expensesQuery.error) {
            console.error('Error fetching expenses data:', expensesQuery.error);
            throw expensesQuery.error;
          }
          console.log(`Fetched ${expensesQuery.data?.length || 0} expense records`);
          
          // If no data found, return empty results
          if ((!incomeQuery.data || incomeQuery.data.length === 0) && 
              (!expensesQuery.data || expensesQuery.data.length === 0)) {
            console.log('No income or expense data found for the selected period');
            return {
              income: 0,
              expenses: 0,
              net: 0,
              incomeData: [],
              expenseData: [],
              incomeByCategory: {},
              expensesByCategory: {},
              transactions: [],
              timeRange: {
                start: timeFilter.start.toISOString(),
                end: timeFilter.end.toISOString()
              }
            };
          }

          // Process income data
          const processedIncomes = incomeQuery.data?.map(inc => ({
            id: inc.id,
            name: inc.source_name,
            amount: parseFloat(inc.amount) || 0,
            date: inc.start_date,
            category: inc.income_categories?.name || 'Uncategorized',
            type: 'income'
          })) || [];

          // Process expense data
          const processedExpenses = expensesQuery.data?.map(exp => ({
            id: exp.id,
            name: exp.name,
            amount: parseFloat(exp.amount) || 0,
            date: exp.expense_date,
            category: exp.expense_categories?.name || 'Uncategorized',
            type: 'expense'
          })) || [];

          // Calculate totals
          const totalIncome = processedIncomes.reduce((sum, inc) => sum + inc.amount, 0);
          const totalExpenses = processedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          const net = totalIncome - totalExpenses;

          // Group by category for charts
          const incomeByCategory = groupByCategory(processedIncomes);
          const expensesByCategory = groupByCategory(processedExpenses);

          // Combine all transactions and sort by date
          const allTransactions = [...processedIncomes, ...processedExpenses]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(t => ({
              ...t,
              formattedAmount: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(t.amount)
            }));

          // Format the response to match the expected structure
          return {
            totalIncome,
            totalExpenses,
            netIncome: net,
            monthlyData: getMonthlyData(processedExpenses, processedIncomes, timeFilter),
            categoryData: getCategoryData(processedExpenses),
            recentTransactions: allTransactions.slice(0, 10),
            incomeData: processedIncomes,
            expenseData: processedExpenses,
            incomeByCategory,
            expensesByCategory,
            transactions: allTransactions,
            timeRange: {
              start: timeFilter.start.toISOString(),
              end: timeFilter.end.toISOString()
            },
            // Add formatted values for display
            formattedTotalIncome: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(totalIncome),
            formattedTotalExpenses: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(totalExpenses),
            formattedNet: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(net)
          };
        } catch (error) {
          console.error('Error processing income-expense data:', error);
          throw error;
        }
      case 'expense-trends':
        try {
          console.log('Fetching expense trends data for period:', {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
            userId
          });

          // Fetch expense data with date range filtering
          const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('*, expense_categories(name)')
            .eq('user_id', userId)
            .gte('expense_date', timeFilter.start.toISOString())
            .lte('expense_date', timeFilter.end.toISOString())
            .order('expense_date', { ascending: false });

          if (expensesError) {
            console.error('Error fetching expenses data:', expensesError);
            throw expensesError;
          }
          console.log(`Fetched ${expensesData?.length || 0} expense records`);

          if (!expensesData || expensesData.length === 0) {
            console.log('No expense data found for the selected period');
            return [];
          }


          // Process expense data for the report
          const processedExpenses = expensesData.map((expense: any) => {
            const amount = parseFloat(expense.amount) || 0;
            const formattedAmount = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(amount);
            
            return {
              id: expense.id || `exp-${Math.random().toString(36).substr(2, 9)}`,
              name: (typeof expense.name === 'string' && expense.name.trim() !== '' && expense.name !== 'Unnamed Expense')
                ? expense.name
                : (typeof expense.merchant === 'string' && expense.merchant.trim() !== '' ? expense.merchant : 'Unnamed Expense'),
              amount: amount,
              formatted_amount: formattedAmount,
              expense_date: expense.expense_date,
              formatted_expense_date: new Date(expense.expense_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              category: expense.expense_categories?.name || 'Uncategorized',
              frequency: expense.recurrence || 'none',
              warranty_expiry: expense.warranty_expiration_date || ''
            }
          });

          // Group expenses by category with warranty information
          const categoryMap = new Map();
          let totalAmount = 0;
          let totalTransactions = 0;
          const allTransactions: any[] = [];

          // First, process each expense and add to categories
          processedExpenses.forEach((expense: any) => {
            const categories = expense.all_categories || [expense.category || 'Uncategorized'];
            const amount = parseFloat(expense.amount) || 0;
            totalAmount += amount; // Increment totalAmount
            totalTransactions += 1; // Increment totalTransactions
            
            // Add to each category this expense belongs to
            categories.forEach((categoryName: string) => {
              if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, {
                  id: `cat-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
                  name: categoryName,
                  total: 0,
                  count: 0,
                  color: getDefaultColorForCategory(categoryName),
                  transactions: []
                });
              }
              
              const category = categoryMap.get(categoryName);
              category.total += amount;
              category.count += 1;
              
              // Only add the transaction to the first category to avoid duplicates
              if (categories[0] === categoryName) {
                category.transactions.push({
                  id: expense.id,
                  name: (typeof expense.name === 'string' && expense.name.trim() !== '' && expense.name !== 'Unnamed Expense')
                    ? expense.name
                    : (typeof expense.merchant === 'string' && expense.merchant.trim() !== '' ? expense.merchant : 'Unnamed Expense'),
                  amount: expense.amount, // This should be the numeric amount
                  formatted_amount: expense.formatted_amount,
                  date: expense.expense_date, // Use expense_date
                  formatted_date: expense.formatted_expense_date, // Use formatted_expense_date
                  frequency: expense.frequency,
                  warranty_expiry: expense.warranty_expiry,
                  formatted_warranty_expiry: expense.formatted_warranty_expiry
                });
              }
            });
            
            // Add to all transactions
            allTransactions.push({
              id: expense.id,
              name: expense.name,
              amount: expense.amount,
              formatted_amount: expense.formatted_amount,
              date: expense.date,
              formatted_date: expense.formatted_date,
              category: expense.category,
              all_categories: [...(expense.all_categories || [expense.category])],
              frequency: expense.frequency,
              warranty_expiry: expense.warranty_expiry,
              formatted_warranty_expiry: expense.formatted_warranty_expiry || 'N/A'
            });
            
            totalAmount += amount;
            totalTransactions += 1;
          });

          // Sort transactions within each category by date (newest first)
          categoryMap.forEach(category => {
            category.transactions.sort((a: any, b: any) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          });

          // Convert map to array and calculate percentages
          const categories = Array.from(categoryMap.values()).map((category: any) => ({
            ...category,
            formatted_total: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(category.total),
            percent_of_total: totalAmount > 0 ? (category.total / totalAmount) * 100 : 0,
            formatted_percent: totalAmount > 0 ? `${((category.total / totalAmount) * 100).toFixed(1)}%` : '0.0%',
            average_amount: category.count > 0 ? category.total / category.count : 0,
            formatted_average: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(category.count > 0 ? category.total / category.count : 0)
          }));

          // Sort categories by total amount (descending)
          categories.sort((a: any, b: any) => b.total - a.total);
          
          // Sort all transactions by date (newest first)
          const sortedTransactions = [...allTransactions].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          console.log('Processed expense trends data:', {
            totalCategories: categories.length,
            totalTransactions: sortedTransactions.length,
            totalAmount,
            sampleCategory: categories[0],
            sampleTransaction: sortedTransactions[0]
          });

          // Return the structured data for the report
          return {
            categories,
            transactions: sortedTransactions,
            total_amount: totalAmount,
            formatted_total: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(totalAmount),
            total_transactions: totalTransactions,
            time_range: {
              start: timeFilter.start.toISOString(),
              end: timeFilter.end.toISOString(),
              formatted_start: timeFilter.start.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              formatted_end: timeFilter.end.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            },
            generated_at: new Date().toISOString(),
            formatted_generated_at: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          };
        } catch (error) {
          console.error('Error processing expense trends data:', error);
          return [];
        }
      case 'net-worth':
        return await fetchNetWorthData(supabase, userId);
      case 'budget-analysis':
        return await fetchBudgetAnalysisData(supabase, userId, timeFilter);
      case 'spending-categories':
        return await fetchSpendingCategoriesData(supabase, userId, timeFilter);
      case 'debt': {
        // Fetch all debts for the authenticated user
        try {
          const { data: debts, error } = await supabase
            .from('debts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching debts:', error);
            return [];
          }

          if (!debts) {
            console.log('No debt data returned for user:', userId);
            return [];
          }

          const mappedDebts = debts.map((debt: any) => ({
            name: debt.name || '',
            type: debt.type || '', // This is the debt 'type' or 'category'
            balance: typeof debt.current_balance === 'number' 
              ? debt.current_balance 
              : (parseFloat(String(debt.current_balance)) || 0),
            interest_rate: typeof debt.interest_rate === 'number' 
              ? debt.interest_rate 
              : (parseFloat(String(debt.interest_rate)) || 0),
            minimum_payment: typeof debt.minimum_payment === 'number' 
              ? debt.minimum_payment 
              : (parseFloat(String(debt.minimum_payment)) || 0),
          }));
          console.log(`Mapped ${mappedDebts.length} debts for report.`);
          return mappedDebts;
        } catch (e) {
          console.error('Exception processing debt data for report:', e);
          return [];
        }
      } // Closes case 'debt': {

      case 'income-sources': {
        try {
          const { data: incomeData, error } = await supabase
            .from('incomes')
            .select('*, income_categories!inner(*)')
            .eq('user_id', userId)
            .order('start_date', { ascending: false });

          if (error) {
            console.error('Error fetching income sources:', error);
            return []; // Return empty array to trigger "no data" message
          }

          if (!incomeData || incomeData.length === 0) {
            console.log('No income data found for user:', userId);
            return [];
          }


          // Process income data for the report
          const processedIncomes = incomeData.map(income => ({
            id: income.id,
            source: income.source_name || 'Unnamed Source',
            amount: parseFloat(income.amount) || 0,
            category: income.income_categories?.name || 'Uncategorized',
            frequency: income.recurrence || 'one_time',
            start_date: income.start_date,
            formatted_date: income.start_date ? new Date(income.start_date).toLocaleDateString() : 'N/A',
            formatted_amount: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(parseFloat(income.amount) || 0)
          }));
          
          // Calculate total for percentage calculations
          const totalIncome = processedIncomes.reduce((sum: number, item: any) => sum + item.amount, 0);
          
          // Group by source to combine duplicates and calculate counts
          const sourceMap = new Map();
          
          processedIncomes.forEach((income: any) => {
            if (!sourceMap.has(income.source)) {
              sourceMap.set(income.source, {
                ...income,
                count: 0,
                recurring_count: 0,
                total_amount: 0
              });
            }
            const source = sourceMap.get(income.source);
            source.count += 1;
            source.total_amount += income.amount;
            if (income.frequency !== 'one_time') {
              source.recurring_count += 1;
            }
          });

          // Convert map to array and calculate percentages
          const sources = Array.from(sourceMap.values()).map((source: any) => ({
            ...source,
            amount: source.total_amount,
            formatted_amount: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(source.total_amount),
            percent_of_total: totalIncome > 0 ? (source.total_amount / totalIncome) * 100 : 0,
            formatted_percent: totalIncome > 0 ? `${((source.total_amount / totalIncome) * 100).toFixed(1)}%` : '0.0%',
            recurring_percentage: source.count > 0 ? (source.recurring_count / source.count) * 100 : 0
          }));

          console.log('Processed income sources for report:', {
            totalSources: sources.length,
            totalIncome,
            sampleSource: sources[0]
          });

          // Return the array of income sources
          return sources;
        } catch (error) {
          console.error('Error processing income sources:', error);
          return [];
        }
      }
      default: {
        const errorMessage = `Unsupported report type: ${reportType}`;
        console.error(errorMessage);
        return {
          error: 'Unsupported report type',
          message: `The report type '${reportType}' is not supported.`,
          supportedTypes: ['overview', 'income-expense', 'expense-trends', 'income-sources', 'spending-categories', 'budget-analysis', 'net-worth']
        };
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in fetchReportData (${reportType}):`, errorMessage);
    
    // Return a user-friendly error response
    return {
      error: `Failed to generate ${reportType} report`,
      details: errorMessage,
      timestamp: new Date().toISOString()
    };
  }
}

// Helper function to group transactions by category
function groupByCategory(transactions: any[]) {
  return transactions.reduce((acc, curr) => {
    const category = curr.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += curr.amount;
    return acc;
  }, {} as Record<string, number>);
}

// This function is kept for backward compatibility but the logic is now in fetchReportData
async function fetchIncomeExpenseData(supabase: any, userId: string, timeFilter: any) {
  try {
    const result = await fetchReportData('income-expense', timeFilter);
    return result || {
      income: 0,
      expenses: 0,
      net: 0,
      incomeData: [],
      expenseData: [],
      incomeByCategory: {},
      expensesByCategory: {},
      transactions: [],
      timeRange: {
        start: timeFilter.start.toISOString(),
        end: timeFilter.end.toISOString()
      }
    };
  } catch (error) {
    console.error('Error in fetchIncomeExpenseData:', error);
    throw error;
  }
}

// Fetch net worth data
async function fetchNetWorthData(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assets: Array<{ name: string; amount: number; type: string }>;
  liabilities: Array<{ name: string; amount: number; type: string }>;
}> {
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
    );
    
    const liabilities = accounts.filter((account: any) => 
      account.type === 'credit_card' || 
      account.type === 'loan' || 
      account.type === 'mortgage' ||
      account.type === 'other_liability'
    );
    
    // Process assets
    const processedAssets = assets.map((asset: any) => {
      return {
        name: asset.name || 'Unnamed Account',
        amount: parseFloat(asset.current_balance) || 0,
        type: asset.type || 'other' 
      };
    });
    
    // Process liabilities
    const processedLiabilities = liabilities.map((liability: any) => {
      return {
        name: liability.name || 'Unnamed Account',
        amount: parseFloat(liability.current_balance) || 0,
        type: liability.type || 'other'
      };
    });
    
    // Calculate totals
    const totalAssetsValue = assets.reduce((sum: number, asset: any) => sum + (parseFloat(asset.current_balance) || 0), 0);
    const totalLiabilitiesValue = liabilities.reduce((sum: number, liability: any) => sum + (parseFloat(liability.current_balance) || 0), 0);
    const netWorthValue = totalAssetsValue - totalLiabilitiesValue;
    
    return {
      assets: processedAssets,
      liabilities: processedLiabilities,
      totalAssets: totalAssetsValue,
      totalLiabilities: totalLiabilitiesValue,
      netWorth: netWorthValue
    };
  } else {
    if (accountsError) {
      console.error('Error fetching accounts for net worth:', accountsError);
      // Optionally, rethrow or handle more gracefully
    }
    // Return default structure if no data or error
    return {
      assets: [],
      liabilities: [],
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0
    };
  }
}

// Fetch budget analysis data
async function fetchBudgetAnalysisData(
  supabase: SupabaseClient,
  userId: string,
  timeFilter: { start: Date; end: Date }
): Promise<{
  budgets: Array<{
    id: string;
    name: string;
    amount: number;
    spent: number;
    remaining: number;
    progress: number;
    category: string;
  }>;
  totalBudget: number;
  totalSpent: number;
}> {
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
        amount: budgetAmount,
        spent: totalSpent,
        remaining: remaining,
        progress: budgetAmount > 0 ? (totalSpent / budgetAmount) : 0, // Normalized progress (0-1)
      };
    });
    
    // Calculate overall budget metrics
    const totalBudgeted = budgets.reduce((sum: number, budget: any) => sum + (parseFloat(budget.amount) || 0), 0);
    const overallTotalSpent = expenses ? expenses.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0) : 0;
    // overallPercentUsed is not part of the return type, so it can be removed or kept for logging if needed.
    
    return {
      budgets: budgetAnalysis,
      totalBudget: totalBudgeted,
      totalSpent: overallTotalSpent
    };
  } else {
    if (budgetsError) {
      console.error("Error fetching budgets for budget analysis:", budgetsError);
    }
    // Return default structure if no data or error
    return {
      budgets: [],
      totalBudget: 0,
      totalSpent: 0
    };
  }
}

// Fetch spending by category data
async function fetchSpendingCategoriesData(
  supabase: SupabaseClient,
  userId: string,
  timeFilter: { start: Date; end: Date }
): Promise<ReportData> {
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
      // Use a default color if color is not available
      const categoryColor = expense.expense_categories?.color || 
        (expense.expense_categories?.id ? getDefaultColorForCategory(expense.expense_categories.id) : '#888888')
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
        formatted_amount: formatCurrency(category.amount),
        percent_of_total: percentOfTotal,
        formatted_percent: `${percentOfTotal.toFixed(1)}%`,
        average_transaction: category.transaction_count > 0 ? 
          (category.amount / category.transaction_count) : 0,
        formatted_average: formatCurrency(category.transaction_count > 0 ? 
          (category.amount / category.transaction_count) : 0)
      }
    }).sort((a: any, b: any) => b.amount - a.amount)
    
    return {
      categories,
      summary: {
        total_spending: totalSpending,
        formatted_total: formatCurrency(totalSpending),
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
async function fetchIncomeSourcesData(
  supabase: SupabaseClient,
  userId: string,
  timeFilter: { start: Date; end: Date }
): Promise<{
  categories: Array<{
    id: string;
    name: string;
    amount: number;
    color: string;
    percent: number;
    transactions: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
    }>;
  }>;
  total: number;
}> {
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
