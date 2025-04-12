"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Expense {
  id: string
  merchant: string
  category: string
  amount: number
  date: Date
  location?: {
    address: string
    coordinates: { lat: number; lng: number }
  }
}

interface ExpenseCalendarProps {
  expenses: Expense[]
}

export function ExpenseCalendar({ expenses }: ExpenseCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Get the current month and year
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get the first day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)

  // Get the last day of the month
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)

  // Get the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDayOfMonth.getDay()

  // Get the number of days in the month
  const daysInMonth = lastDayOfMonth.getDate()

  // Create an array of days for the calendar
  const days = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null)
  }

  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentYear, currentMonth, i))
  }

  // Group expenses by date
  const expensesByDate: Record<string, Expense[]> = {}

  expenses.forEach((expense) => {
    const dateKey = expense.date.toDateString()
    if (!expensesByDate[dateKey]) {
      expensesByDate[dateKey] = []
    }
    expensesByDate[dateKey].push(expense)
  })

  // Get expenses for the selected date
  const selectedDateExpenses = selectedDate ? expensesByDate[selectedDate.toDateString()] || [] : []

  // Get total amount for a specific date
  const getTotalForDate = (date: Date) => {
    const dateKey = date.toDateString()
    if (!expensesByDate[dateKey]) return 0

    return expensesByDate[dateKey].reduce((total, expense) => total + expense.amount, 0)
  }

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    setSelectedDate(null)
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    setSelectedDate(null)
  }

  // Navigate to current month
  const goToCurrentMonth = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  // Format month and year
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  // Check if a date has expenses
  const hasExpenses = (date: Date) => {
    return !!expensesByDate[date.toDateString()]
  }

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-medium">{formatMonthYear(currentDate)}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm font-medium py-2">
            {day}
          </div>
        ))}

        {days.map((day, index) => (
          <div key={index} className="aspect-square">
            {day ? (
              <Button
                variant="ghost"
                className={`w-full h-full rounded-md flex flex-col items-center justify-start p-1 ${
                  selectedDate && day.toDateString() === selectedDate.toDateString() ? "bg-primary/10" : ""
                } ${isToday(day) ? "border border-primary" : ""}`}
                onClick={() => setSelectedDate(day)}
              >
                <span className="text-sm">{day.getDate()}</span>
                {hasExpenses(day) && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(getTotalForDate(day))}
                    </Badge>
                  </div>
                )}
              </Button>
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        ))}
      </div>

      {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>

            {selectedDateExpenses.length === 0 ? (
              <p className="text-muted-foreground text-sm">No expenses for this date</p>
            ) : (
              <div className="space-y-2">
                {selectedDateExpenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{expense.merchant}</p>
                      <p className="text-sm text-muted-foreground">{expense.category}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2">
                  <p className="font-medium">Total</p>
                  <p className="font-medium">
                    {formatCurrency(selectedDateExpenses.reduce((total, expense) => total + expense.amount, 0))}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

