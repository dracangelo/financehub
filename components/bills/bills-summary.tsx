"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getBills } from "@/app/actions/bills"
import { formatCurrency } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

interface Bill {
  id: string
  name: string
  amount: number
  next_payment_date: string
  billing_frequency?: string
  auto_pay?: boolean
  payment_schedule?: { status: string; scheduled_date: string }[]
  billers?: { name: string; category: string }
  is_paid?: boolean
  bill_payments?: {
    id: string
    payment_date: string
    payment_status: string
    amount_paid: number
    payment_method: string
  }[]
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
    overdueBillsCount: 0,
    dueSoonBillsCount: 0,
    upcomingBillsCount: 0,
    totalBillsCount: 0
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

    // Count for each category
    let overdueBillsCount = 0
    let dueSoonBillsCount = 0
    let upcomingBillsCount = 0

    bills.forEach((bill) => {
      // Check for bill payments
      if (bill.bill_payments && bill.bill_payments.length > 0) {
        // Sort payments by date, most recent first
        const sortedPayments = [...bill.bill_payments].sort((a, b) => 
          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        );
        
        // If the most recent payment has a completed status, the bill is paid
        if (sortedPayments[0].payment_status === "completed") {
          return; // Skip paid bills
        }
      }
      
      // Skip bills that are explicitly marked as paid
      if (bill.is_paid) return;
      
      // Skip bills that have a paid status in payment_schedule
      if (bill.payment_schedule && 
          bill.payment_schedule.length > 0 && 
          bill.payment_schedule[0].status === "paid") {
        return;
      }
      
      try {
        const dueDate = new Date(bill.next_payment_date)
        if (isNaN(dueDate.getTime())) return; // Skip invalid dates
        
        // If auto_pay is enabled and due date has passed, consider it paid
        if (bill.auto_pay && dueDate < today) {
          return; // Skip auto-paid bills
        }
        
        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        totalDue += bill.amount

        if (diffDays < 0) {
          overdue += bill.amount
          overdueBillsCount++
        } else if (diffDays <= 7) {
          dueSoon += bill.amount
          dueSoonBillsCount++
        } else {
          upcoming += bill.amount
          upcomingBillsCount++
        }
      } catch (e) {
        console.error("Error processing bill date:", e);
      }
    })

    setSummary({
      totalDue: Math.round(totalDue * 100) / 100,
      dueSoon: Math.round(dueSoon * 100) / 100,
      overdue: Math.round(overdue * 100) / 100,
      upcoming: Math.round(upcoming * 100) / 100,
      overdueBillsCount,
      dueSoonBillsCount,
      upcomingBillsCount,
      totalBillsCount: overdueBillsCount + dueSoonBillsCount + upcomingBillsCount
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

  // Count unpaid bills
  const unpaidCount = bills.filter(bill => {
    if (bill.is_paid) return false;
    if (bill.payment_schedule && 
        bill.payment_schedule.length > 0 && 
        bill.payment_schedule[0].status === "paid") {
      return false;
    }
    return true;
  }).length;

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
            {summary.totalBillsCount} unpaid bills
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
          <p className="text-xs text-muted-foreground mt-1">
            {summary.overdueBillsCount} {summary.overdueBillsCount === 1 ? 'bill' : 'bills'} require immediate attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-yellow-600">Due Soon</CardTitle>
          <CardDescription>Due within 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.dueSoon)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.dueSoonBillsCount} {summary.dueSoonBillsCount === 1 ? 'bill' : 'bills'} need attention soon
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-600">Upcoming</CardTitle>
          <CardDescription>Future bills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.upcoming)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.upcomingBillsCount} {summary.upcomingBillsCount === 1 ? 'bill' : 'bills'} coming up
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
