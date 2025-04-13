"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, DollarSign, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getExpenses } from "@/app/actions/expenses"
import { Skeleton } from "@/components/ui/skeleton"
import { formatExpenseForCalendar, getExpenseSummaryByDay } from "@/lib/expense-utils"
import { Expense } from "@/types/expense"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function ExpenseCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch expenses from the database
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true)
      try {
        const data = await getExpenses()
        setExpenses(data)
      } catch (error) {
        console.error("Error fetching expenses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()

    // Set up a listener for when new expenses are added
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'expense_added' || e.key === 'expense_updated' || e.key === 'expense_deleted') {
        fetchExpenses()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events (for same-window updates)
    const handleCustomEvent = () => {
      fetchExpenses()
    }
    
    window.addEventListener('expense_updated', handleCustomEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('expense_updated', handleCustomEvent)
    }
  }, [])

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
    const date = new Date(expense.spent_at)
    const dateKey = date.toDateString()
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

  // Get color intensity based on spending amount
  const getColorIntensity = (amount: number) => {
    // Find the maximum amount spent on any day this month
    const maxAmount = days
      .filter(Boolean)
      .reduce((max, day) => Math.max(max, getTotalForDate(day as Date)), 0)
    
    if (maxAmount === 0) return 0
    
    // Calculate intensity (0-100)
    return Math.min(100, Math.round((amount / maxAmount) * 100))
  }

  // Get background color based on spending amount
  const getSpendingColor = (amount: number) => {
    const intensity = getColorIntensity(amount)
    
    if (intensity === 0) return ""
    
    // Return a red color with varying opacity based on intensity
    return `rgba(239, 68, 68, ${intensity / 100})`
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Expense Calendar</CardTitle>
        <CardDescription>View your spending patterns by date</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
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
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full h-full rounded-md flex flex-col items-center justify-start p-1",
                              selectedDate && day.toDateString() === selectedDate.toDateString() ? "bg-primary/10" : "",
                              isToday(day) ? "border border-primary" : ""
                            )}
                            onClick={() => setSelectedDate(day)}
                            style={{
                              backgroundColor: hasExpenses(day) ? getSpendingColor(getTotalForDate(day)) : ""
                            }}
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
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-0 w-64">
                          {hasExpenses(day) ? (
                            <Card className="border-0 shadow-none">
                              <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-sm flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                                </CardTitle>
                                <CardDescription>
                                  Total: {formatCurrency(getTotalForDate(day))}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="p-3 pt-0 max-h-48 overflow-y-auto">
                                <div className="space-y-1">
                                  {expensesByDate[day.toDateString()].map((expense) => (
                                    <div key={expense.id} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0">
                                      <div>
                                        <p className="font-medium">{expense.description}</p>
                                        {expense.category && (
                                          <p className="text-muted-foreground">{expense.category}</p>
                                        )}
                                      </div>
                                      <p className="font-medium">{formatCurrency(expense.amount)}</p>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <Card className="border-0 shadow-none">
                              <CardContent className="p-3">
                                <p className="text-sm text-muted-foreground">No expenses on this day</p>
                              </CardContent>
                            </Card>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                            <p className="font-medium">{expense.description}</p>
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
        )}
      </CardContent>
    </Card>
  )
}
