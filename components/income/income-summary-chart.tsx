"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { formatCurrency } from "@/lib/utils"
import type { IncomeSource } from "@/types/income"

interface IncomeSummaryChartProps {
  sources: IncomeSource[]
  variant?: "bar" | "pie"
}

export function IncomeSummaryChart({ sources, variant = "bar" }: IncomeSummaryChartProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [totalMonthly, setTotalMonthly] = useState(0)

  useEffect(() => {
    if (sources) {
      processData(sources)
    }
  }, [sources])

  const processData = (sources: IncomeSource[]) => {
    // Group by type and calculate monthly amounts
    const typeMap = new Map<string, number>()
    let total = 0

    sources.forEach((source) => {
      let monthlyAmount = source.amount
      
      // Convert to monthly amount based on frequency
      switch (source.frequency) {
        case "annually":
          monthlyAmount /= 12
          break
        case "quarterly":
          monthlyAmount /= 3
          break
        case "bi-weekly":
          monthlyAmount *= 2.17 // Average number of bi-weekly periods in a month
          break
        case "weekly":
          monthlyAmount *= 4.33 // Average number of weeks in a month
          break
        case "daily":
          monthlyAmount *= 30.42 // Average number of days in a month
          break
      }

      const type = source.type.replace("-", " ")
      const currentAmount = typeMap.get(type) || 0
      typeMap.set(type, currentAmount + monthlyAmount)
      total += monthlyAmount
    })

    // Convert map to array for chart
    const data = Array.from(typeMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value * 100) / 100
    }))

    setChartData(data)
    setTotalMonthly(Math.round(total * 100) / 100)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']

  if (loading) {
    return <Skeleton className="h-[150px] w-full" />
  }

  if (error) {
    return <div className="text-center text-muted-foreground">{error}</div>
  }

  if (sources.length === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center text-center">
        <p className="text-muted-foreground">No income sources added yet</p>
      </div>
    )
  }

  if (variant === "pie") {
    return (
      <div className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-3xl font-bold">{formatCurrency(totalMonthly)}</div>
      <div className="h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis hide />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Bar dataKey="value" fill="#0088FE" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

