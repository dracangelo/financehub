"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getBills } from "@/app/actions/bills"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { AlertCircle } from "lucide-react"

interface Bill {
  id: string
  name: string
  amount: number
  due_date: string
  status: string
}

export function BillsSummary() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState({
    totalDue: 0,
    dueSoon: 0,
    overdue: 0,
    upcoming: 0,
    billsByDay: [] as { name: string; amount: number }[],
  })

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const data = await getBills()
        setBills(data)
        calculateSummary(data)
      } catch (err) {
        setError("Error fetching bills")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchBills()
  }, [])

  const calculateSummary = (bills: Bill[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let totalDue = 0
    let dueSoon = 0
    let overdue = 0
    let upcoming = 0

    // Group bills by day of month for chart
    const dayMap = new Map<number, number>()

    bills.forEach((bill) => {
      if (bill.status !== "paid") {
        const dueDate = new Date(bill.due_date)
        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        totalDue += bill.amount

        if (diffDays < 0) {
          overdue += bill.amount
        } else if (diffDays <= 7) {
          dueSoon += bill.amount
        } else {
          upcoming += bill.amount
        }

        // Add to day map for chart
        const dayOfMonth = dueDate.getDate()
        const currentAmount = dayMap.get(dayOfMonth) || 0
        dayMap.set(dayOfMonth, currentAmount + bill.amount)
      }
    })

    // Convert map to array for chart
    const billsByDay = Array.from(dayMap.entries())
      .map(([day, amount]) => ({
        name: day.toString(),
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => Number.parseInt(a.name) - Number.parseInt(b.name))

    setSummary({
      totalDue: Math.round(totalDue * 100) / 100,
      dueSoon: Math.round(dueSoon * 100) / 100,
      overdue: Math.round(overdue * 100) / 100,
      upcoming: Math.round(upcoming * 100) / 100,
      billsByDay,
    })
  }

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
          <CardTitle>Total Due</CardTitle>
          <CardDescription>All unpaid bills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalDue)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {bills.filter((b) => b.status !== "paid").length} unpaid bills
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-destructive">Overdue</CardTitle>
          <CardDescription>Past due bills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.overdue)}</div>
          <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-500">Due Soon</CardTitle>
          <CardDescription>Due in the next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.dueSoon)}</div>
          <p className="text-xs text-muted-foreground mt-1">Plan to pay these bills soon</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Upcoming</CardTitle>
          <CardDescription>Due later this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.upcoming)}</div>
          <p className="text-xs text-muted-foreground mt-1">Plan ahead for these expenses</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Bills by Due Date</CardTitle>
          <CardDescription>Monthly distribution of bills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {summary.billsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.billsByDay} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" label={{ value: "Day of Month", position: "insideBottom", offset: -5 }} />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No bills data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

