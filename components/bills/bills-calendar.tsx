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
  due_date: string
  status: string
}

export function BillsCalendar() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<Array<{ date: Date; bills: Bill[] }>>([])

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const data = await getBills()
        setBills(data)
      } catch (err) {
        setError("Error fetching bills")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchBills()
  }, [])

  useEffect(() => {
    generateCalendarDays(currentMonth)
  }, [bills, currentMonth])

  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()

    // Get first day of month and last day of month
    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)

    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate()

    const days = []

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, monthIndex - 1, prevMonthLastDay - i)
      days.push({
        date,
        bills: getBillsForDate(date),
      })
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, monthIndex, i)
      days.push({
        date,
        bills: getBillsForDate(date),
      })
    }

    // Add days from next month to complete grid (6 rows of 7 days = 42 total)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, monthIndex + 1, i)
      days.push({
        date,
        bills: getBillsForDate(date),
      })
    }

    setCalendarDays(days)
  }

  const getBillsForDate = (date: Date) => {
    return bills.filter((bill) => {
      const billDate = new Date(bill.due_date)
      return (
        billDate.getDate() === date.getDate() &&
        billDate.getMonth() === date.getMonth() &&
        billDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const changeMonth = (increment: number) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + increment)
    setCurrentMonth(newMonth)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  if (loading) {
    return <Skeleton className="h-[600px] w-full" />
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bills Calendar</CardTitle>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeMonth(-1)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3"
            >
              Previous
            </button>
            <div className="font-medium">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3"
            >
              Next
            </button>
          </div>
        </div>
        <CardDescription>View your bills by due date</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center font-medium mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-[100px] p-1 border rounded-md ${
                isToday(day.date)
                  ? "bg-primary/10 border-primary"
                  : isCurrentMonth(day.date)
                    ? "bg-card"
                    : "bg-muted/30 text-muted-foreground"
              }`}
            >
              <div className="text-right text-sm font-medium p-1">{day.date.getDate()}</div>
              <div className="space-y-1">
                {day.bills.map((bill) => (
                  <div
                    key={bill.id}
                    className={`text-xs p-1 rounded ${
                      bill.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : new Date(bill.due_date) < new Date()
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    <div className="font-medium truncate">{bill.name}</div>
                    <div>{formatCurrency(bill.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

