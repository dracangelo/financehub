"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { AlertCircle, TrendingDown } from "lucide-react"

interface DebtSummary {
  totalDebt: number
  debtByType: {
    name: string
    value: number
    color: string
  }[]
  interestPaid: number
  debtToIncomeRatio: number
  monthlyPayments: number
}

export function DebtOverview() {
  const [summary, setSummary] = useState<DebtSummary>({
    totalDebt: 0,
    debtByType: [],
    interestPaid: 0,
    debtToIncomeRatio: 0,
    monthlyPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // In a real app, this would fetch from your API
    const fetchDebtSummary = async () => {
      try {
        // Simulated data
        const data = {
          totalDebt: 45750,
          debtByType: [
            { name: "Credit Card", value: 5750, color: "#FF8042" },
            { name: "Auto Loan", value: 18500, color: "#0088FE" },
            { name: "Student Loan", value: 21500, color: "#00C49F" },
          ],
          interestPaid: 3250,
          debtToIncomeRatio: 0.32,
          monthlyPayments: 1250,
        }

        setSummary(data)
      } catch (err) {
        setError("Error fetching debt summary")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDebtSummary()
  }, [])

  if (loading) {
    return <Skeleton className="h-[200px] w-full" />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-destructive mr-2" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Total Debt</CardTitle>
          <CardDescription>All outstanding balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalDebt)}</div>
          <p className="text-xs text-muted-foreground mt-1">{summary.debtByType.length} active debts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Monthly Payments</CardTitle>
          <CardDescription>Total monthly obligations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.monthlyPayments)}</div>
          <p className="text-xs text-muted-foreground mt-1">Due each month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Interest Paid YTD</CardTitle>
          <CardDescription>Year-to-date interest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.interestPaid)}</div>
          <p className="text-xs text-muted-foreground mt-1">Money paid to lenders</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Debt-to-Income</CardTitle>
          <CardDescription>Debt as % of income</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(summary.debtToIncomeRatio * 100).toFixed(1)}%</div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
            <span>Decreased 2.5% from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Debt Breakdown</CardTitle>
          <CardDescription>Distribution by debt type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.debtByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {summary.debtByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

