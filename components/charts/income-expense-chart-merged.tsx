"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils/formatting" // Updated import
import { addMonths, format } from "date-fns"

interface IncomeExpenseData {
  month: string
  income: number
  expenses: number
  recurring_income?: number
  recurring_expenses?: number
  one_time_income?: number
  one_time_expenses?: number
  is_projected?: boolean
}

interface IncomeExpenseChartProps {
  data: IncomeExpenseData[]
  title?: string
  description?: string
  totalIncome?: number
  totalExpenses?: number
  recurringIncome?: number
  recurringExpenses?: number
  oneTimeIncome?: number
  oneTimeExpenses?: number
  projectMonths?: number
}

export function IncomeExpenseChart({
  data,
  title = "Income vs. Expenses",
  description = "Monthly comparison of income and expenses",
  totalIncome: propTotalIncome,
  totalExpenses: propTotalExpenses,
  recurringIncome: propRecurringIncome,
  recurringExpenses: propRecurringExpenses,
  oneTimeIncome: propOneTimeIncome,
  oneTimeExpenses: propOneTimeExpenses,
  projectMonths = 3, // Default to projecting 3 months into the future
}: IncomeExpenseChartProps) {
  const [timeframe, setTimeframe] = useState("6m")
  const [enhancedData, setEnhancedData] = useState<IncomeExpenseData[]>([])

  // Process data to include projections based on recurring income/expenses
  useEffect(() => {
    if (!data || data.length === 0) return

    // Create a copy of the original data
    const processedData = [...data]

    // Calculate averages for recurring data if not explicitly provided
    const avgRecurringIncome = propRecurringIncome || 
      data.reduce((sum, item) => sum + (item.recurring_income || 0), 0) / 
      data.filter(item => item.recurring_income !== undefined).length || 0
    
    const avgRecurringExpenses = propRecurringExpenses || 
      data.reduce((sum, item) => sum + (item.recurring_expenses || 0), 0) / 
      data.filter(item => item.recurring_expenses !== undefined).length || 0

    // Get the last month from the data
    const lastDataPoint = data[data.length - 1]
    const lastDateParts = lastDataPoint.month.split(' ')
    const lastMonthStr = lastDateParts[0]
    const lastYearStr = lastDateParts[1] || new Date().getFullYear().toString()
    
    // Parse the last date
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const lastMonthIndex = monthNames.indexOf(lastMonthStr)
    const lastDate = new Date(parseInt(lastYearStr), lastMonthIndex)

    // Generate projected months
    for (let i = 1; i <= projectMonths; i++) {
      const projectedDate = addMonths(lastDate, i)
      const projectedMonth = format(projectedDate, 'MMM yyyy')
      
      processedData.push({
        month: projectedMonth,
        income: avgRecurringIncome,
        expenses: avgRecurringExpenses,
        recurring_income: avgRecurringIncome,
        recurring_expenses: avgRecurringExpenses,
        one_time_income: 0,
        one_time_expenses: 0,
        is_projected: true
      })
    }

    setEnhancedData(processedData)
  }, [data, projectMonths, propRecurringIncome, propRecurringExpenses])

  // Filter data based on timeframe
  const filteredData = (() => {
    const months = timeframe === "1y" ? 12 : timeframe === "6m" ? 6 : 3
    return enhancedData.slice(-months - projectMonths).slice(0, months + projectMonths)
  })()

  // Calculate totals from filtered data or use provided totals
  const chartTotalIncome = filteredData
    .filter(item => !item.is_projected) // Exclude projected months from totals
    .reduce((sum, item) => sum + item.income, 0)
  const chartTotalExpenses = filteredData
    .filter(item => !item.is_projected) // Exclude projected months from totals
    .reduce((sum, item) => sum + item.expenses, 0)
  
  // Calculate recurring and one-time totals
  const chartRecurringIncome = filteredData
    .filter(item => !item.is_projected) // Exclude projected months
    .reduce((sum, item) => sum + (item.recurring_income || 0), 0)
  const chartRecurringExpenses = filteredData
    .filter(item => !item.is_projected) // Exclude projected months
    .reduce((sum, item) => sum + (item.recurring_expenses || 0), 0)
  const chartOneTimeIncome = filteredData
    .filter(item => !item.is_projected) // Exclude projected months
    .reduce((sum, item) => sum + (item.one_time_income || 0), 0)
  const chartOneTimeExpenses = filteredData
    .filter(item => !item.is_projected) // Exclude projected months
    .reduce((sum, item) => sum + (item.one_time_expenses || 0), 0)
  
  // Use provided totals if available, otherwise use calculated totals from chart data
  const totalIncome = propTotalIncome !== undefined ? propTotalIncome : chartTotalIncome
  const totalExpenses = propTotalExpenses !== undefined ? propTotalExpenses : chartTotalExpenses
  const recurringIncome = propRecurringIncome !== undefined ? propRecurringIncome : chartRecurringIncome
  const recurringExpenses = propRecurringExpenses !== undefined ? propRecurringExpenses : chartRecurringExpenses
  const oneTimeIncome = propOneTimeIncome !== undefined ? propOneTimeIncome : chartOneTimeIncome
  const oneTimeExpenses = propOneTimeExpenses !== undefined ? propOneTimeExpenses : chartOneTimeExpenses
  
  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Tabs defaultValue="6m" value={timeframe} onValueChange={setTimeframe} className="w-[200px]">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="3m">3M</TabsTrigger>
              <TabsTrigger value="6m">6M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Net Savings</p>
            <p className={`text-2xl font-bold ${netSavings >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netSavings)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Savings Rate</p>
            <p className={`text-2xl font-bold ${savingsRate >= 0 ? "text-green-600" : "text-red-600"}`}>
              {savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Monthly Bar Chart */}
        <div className="h-[300px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: (props) => {
                  const item = filteredData.find(d => d.month === props.payload.value);
                  return item?.is_projected ? '#6b7280' : '#000';
                }}}
                tickFormatter={(value) => {
                  const item = filteredData.find(d => d.month === value);
                  return item?.is_projected ? `${value} (Projected)` : value;
                }}
              />
              <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip
                formatter={(value, name) => {
                  return formatCurrency(value as number);
                }}
                labelFormatter={(label) => {
                  const item = filteredData.find(d => d.month === label);
                  return item?.is_projected ? `Month: ${label} (Projected)` : `Month: ${label}`;
                }}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Income vs Expense Breakdown Comparison */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { 
                  name: 'Breakdown', 
                  income: totalIncome,
                  expenses: totalExpenses
                }
              ]}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
              <YAxis type="category" dataKey="name" />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={() => 'Financial Breakdown'}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
