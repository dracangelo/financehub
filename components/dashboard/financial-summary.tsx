"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  ResponsiveContainer, 
  Bar, 
  Pie, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from "recharts"

interface FinancialSummaryProps {
  // Support both the original interface and the simplified props
  accountSummary?: {
    totalBalance: number
    accountCount: number
    currencyBreakdown: { [key: string]: number }
    typeBreakdown: { [key: string]: number }
  }
  transactionStats?: {
    totalIncome: number
    totalExpenses: number
    netIncome: number
    transactionCount: number
    averageTransaction: number
  }
  monthlyData?: Array<{
    month: string
    income: number
    expenses: number
    recurring_income?: number
    one_time_income?: number
    recurring_expenses?: number
    one_time_expenses?: number
  }>
  // Direct props as passed from dashboard page
  totalIncome?: number
  totalExpenses?: number
  netIncome?: number
  categorySpending: Array<{
    name: string
    amount: number
    color?: string
    is_recurring?: boolean
  }>
}

export function FinancialSummary({ 
  accountSummary, 
  transactionStats, 
  monthlyData, 
  totalIncome: directTotalIncome, 
  totalExpenses: directTotalExpenses, 
  netIncome: directNetIncome, 
  categorySpending 
}: FinancialSummaryProps) {
  // Use either direct props or transactionStats
  const totalIncome = directTotalIncome ?? transactionStats?.totalIncome ?? 0
  const totalExpenses = directTotalExpenses ?? transactionStats?.totalExpenses ?? 0
  const netIncome = directNetIncome ?? transactionStats?.netIncome ?? (totalIncome - totalExpenses)
  
  // Calculate financial health metrics
  const savingsRate = totalIncome > 0 
    ? (netIncome / totalIncome) * 100 
    : 0
  
  // Prepare data for account type breakdown chart
  const accountTypeData = accountSummary?.typeBreakdown 
    ? Object.entries(accountSummary.typeBreakdown).map(([type, amount]) => ({
        name: type,
        value: amount,
      }))
    : []
  
  // Prepare data for category spending chart
  const topCategories = [...(categorySpending || [])]
    .filter(category => category && category.amount > 0) // Filter out categories with no spending
    .sort((a, b) => (b.amount || 0) - (a.amount || 0)) // Sort by amount, handling null/undefined values
    .slice(0, 5) // Get top 5 categories
    
  // Format monthly data for the chart
  const formattedMonthlyData = (monthlyData || []).map(item => ({
    month: item.month,
    income: Number(item.income) || 0,
    expenses: Number(item.expenses) || 0,
    recurring_income: Number(item.recurring_income) || 0,
    one_time_income: Number(item.one_time_income) || 0,
    recurring_expenses: Number(item.recurring_expenses) || 0,
    one_time_expenses: Number(item.one_time_expenses) || 0
  }))
  
  // Default colors for categories
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#58D68D']
  
  return (
    <Card className="w-full overflow-hidden border shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 dark:to-transparent border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 text-blue-500 mr-2" />
              Financial Summary
            </CardTitle>
            <CardDescription>Overview of your financial health and spending patterns</CardDescription>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
            <BarChart className="h-5 w-5 text-blue-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Key Financial Metrics */}
          <div className="space-y-5">
            <h3 className="text-sm font-medium flex items-center">
              <LineChart className="h-4 w-4 mr-1.5 text-muted-foreground" />
              Key Metrics
            </h3>
            <div className="grid gap-3 grid-cols-2">
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/30 dark:to-green-950/10 rounded-lg border border-green-100 dark:border-green-900/30 shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Income</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-950/30 dark:to-red-950/10 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Expenses</div>
                <div className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/10 rounded-lg border border-blue-100 dark:border-blue-900/30 shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Net Income</div>
                <div className={`text-xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netIncome)}
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/30 dark:to-purple-950/10 rounded-lg border border-purple-100 dark:border-purple-900/30 shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Savings Rate</div>
                <div className={`text-xl font-bold ${savingsRate >= 15 ? 'text-green-600' : savingsRate >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                  {savingsRate.toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* Monthly Trend Chart */}
            <div className="border rounded-lg p-4 shadow-sm bg-card">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <LineChart className="h-4 w-4 mr-1.5 text-blue-500" />
                Monthly Trend
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formattedMonthlyData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                    />
                    <Legend />
                    {/* Total Income line removed as requested */}
                    <Line
                      type="monotone"
                      dataKey="recurring_income"
                      name="Recurring Income"
                      stroke="#4ade80"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    {/* Total Expenses line removed as requested */}
                    <Line
                      type="monotone"
                      dataKey="recurring_expenses"
                      name="Recurring Expenses"
                      stroke="#f87171"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Account and Category Breakdown */}
          <div className="space-y-5">
            {/* Account Type Breakdown */}
            <div className="border rounded-lg p-4 shadow-sm bg-card">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <PieChart className="h-4 w-4 mr-1.5 text-purple-500" />
                Account Distribution
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accountTypeData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {accountTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Top Spending Categories */}
            <div className="border rounded-lg p-4 shadow-sm bg-card">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <BarChart className="h-4 w-4 mr-1.5 text-amber-500" />
                Top Spending Categories
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCategories}
                    layout="vertical"
                    margin={{ top: 5, right: 5, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={(value) => `$${value}`} stroke="#6b7280" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#6b7280" 
                      width={100}
                      tickFormatter={(value, index) => {
                        const category = topCategories[index];
                        return category?.is_recurring ? `${value} (Recurring)` : value;
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]}>
                      {topCategories.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color || COLORS[index % COLORS.length]}
                          strokeWidth={entry.is_recurring ? 2 : 0}
                          stroke={entry.is_recurring ? '#000' : 'none'}
                          strokeDasharray={entry.is_recurring ? '5 5' : 'none'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
