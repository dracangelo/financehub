"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils/formatting" // Updated import

interface IncomeExpenseData {
  month: string
  income: number
  expenses: number
}

interface IncomeExpenseChartProps {
  data: IncomeExpenseData[]
  title?: string
  description?: string
  totalIncome?: number
  totalExpenses?: number
}

export function IncomeExpenseChart({
  data,
  title = "Income vs. Expenses",
  description = "Monthly comparison of income and expenses",
  totalIncome: propTotalIncome,
  totalExpenses: propTotalExpenses,
}: IncomeExpenseChartProps) {
  const [timeframe, setTimeframe] = useState("6m")

  // Filter data based on timeframe
  const filteredData = (() => {
    const now = new Date()
    const months = timeframe === "1y" ? 12 : timeframe === "6m" ? 6 : 3

    // For demo purposes, just return the last X items
    return data.slice(-months)
  })()

  // Calculate totals from filtered data or use provided totals
  const chartTotalIncome = filteredData.reduce((sum, item) => sum + item.income, 0)
  const chartTotalExpenses = filteredData.reduce((sum, item) => sum + item.expenses, 0)
  
  // Use provided totals if available, otherwise use calculated totals from chart data
  const totalIncome = propTotalIncome !== undefined ? propTotalIncome : chartTotalIncome
  const totalExpenses = propTotalExpenses !== undefined ? propTotalExpenses : chartTotalExpenses
  
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
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
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
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Total Income vs Expense Comparison */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[{ name: 'Total', income: totalIncome, expenses: totalExpenses }]}
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
                labelFormatter={() => 'Total'}
              />
              <Legend />
              <Bar dataKey="income" name="Total Income" fill="#22c55e" />
              <Bar dataKey="expenses" name="Total Expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

