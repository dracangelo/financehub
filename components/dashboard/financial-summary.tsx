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
  accountSummary: {
    totalBalance: number
    accountCount: number
    currencyBreakdown: { [key: string]: number }
    typeBreakdown: { [key: string]: number }
  }
  transactionStats: {
    totalIncome: number
    totalExpenses: number
    netIncome: number
    transactionCount: number
    averageTransaction: number
  }
  monthlyData: Array<{
    month: string
    income: number
    expenses: number
  }>
  categorySpending: Array<{
    name: string
    amount: number
    color?: string
  }>
}

export function FinancialSummary({ 
  accountSummary, 
  transactionStats, 
  monthlyData, 
  categorySpending 
}: FinancialSummaryProps) {
  // Calculate financial health metrics
  const savingsRate = transactionStats.totalIncome > 0 
    ? (transactionStats.netIncome / transactionStats.totalIncome) * 100 
    : 0
  
  // Prepare data for account type breakdown chart
  const accountTypeData = Object.entries(accountSummary.typeBreakdown).map(([type, amount]) => ({
    name: type,
    value: amount,
  }))
  
  // Prepare data for category spending chart
  const topCategories = [...categorySpending]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
  
  // Default colors for categories
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#58D68D']
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
        <CardDescription>Overview of your financial health and spending patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Key Financial Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Key Metrics</h3>
            <div className="grid gap-3 grid-cols-2">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Income</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(transactionStats.totalIncome)}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Expenses</div>
                <div className="text-xl font-bold text-red-600">{formatCurrency(transactionStats.totalExpenses)}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Net Income</div>
                <div className={`text-xl font-bold ${transactionStats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(transactionStats.netIncome)}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Savings Rate</div>
                <div className={`text-xl font-bold ${savingsRate >= 15 ? 'text-green-600' : savingsRate >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {savingsRate.toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* Monthly Trend Chart */}
            <div>
              <h3 className="text-sm font-medium mb-3">Monthly Trend</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#22c55e"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#ef4444"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Account and Category Breakdown */}
          <div className="space-y-4">
            {/* Account Type Breakdown */}
            <div>
              <h3 className="text-sm font-medium mb-3">Account Distribution</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accountTypeData}
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
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Top Spending Categories */}
            <div>
              <h3 className="text-sm font-medium mb-3">Top Spending Categories</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCategories}
                    layout="vertical"
                    margin={{ top: 5, right: 5, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="amount" name="Amount">
                      {topCategories.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color || COLORS[index % COLORS.length]} 
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
