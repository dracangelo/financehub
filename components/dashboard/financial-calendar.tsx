"use client"

import { useState } from "react"
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns"
import { ChevronLeft, ChevronRight, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { WidgetLayout } from "@/components/dashboard/widget-layout"

// Types for financial day data
interface FinancialDayData {
  date: Date
  income?: number
  expenses?: number
  events?: Array<{
    id: string
    title: string
    amount: number
    type: "income" | "expense"
  }>
}

interface FinancialCalendarProps {
  className?: string
  initialData?: FinancialDayData[]
}

export function FinancialCalendar({ className, initialData = [] }: FinancialCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [financialData, setFinancialData] = useState<FinancialDayData[]>(initialData)

  // Get the first day of the current month
  const firstDayCurrentMonth = startOfMonth(currentDate)

  // Get all days in the current month
  const days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(currentDate),
  })

  // Function to go to previous month
  const previousMonth = () => {
    const firstDayPreviousMonth = addDays(firstDayCurrentMonth, -1)
    setCurrentDate(startOfMonth(firstDayPreviousMonth))
  }

  // Function to go to next month
  const nextMonth = () => {
    const firstDayNextMonth = addDays(endOfMonth(currentDate), 1)
    setCurrentDate(startOfMonth(firstDayNextMonth))
  }

  // Function to get financial data for a specific day
  const getDayData = (day: Date): FinancialDayData | undefined => {
    return financialData.find((data) => format(data.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
  }

  // Mock data generation for demo purposes
  const generateMockData = () => {
    const mockData: FinancialDayData[] = []

    // Generate deterministic data for some days in the current month
    days.forEach((day, index) => {
      // Use the day of the month to determine if we should add data
      // This ensures the same data is generated on both server and client
      const dayOfMonth = day.getDate()
      
      // Add data for specific days of the month (e.g., 1st, 5th, 10th, 15th, 20th, 25th, 30th)
      if (dayOfMonth % 5 === 0 || dayOfMonth === 1) {
        // Use the day of month to determine income/expense values
        const income = dayOfMonth % 3 === 0 ? dayOfMonth * 50 : 0
        const expenses = dayOfMonth % 2 === 0 ? dayOfMonth * 25 : 0

        const events = []
        if (income > 0) {
          events.push({
            id: `income-${index}`,
            title: "Salary deposit",
            amount: income,
            type: "income" as const,
          })
        }

        if (expenses > 0) {
          events.push({
            id: `expense-${index}`,
            title: "Daily expenses",
            amount: expenses,
            type: "expense" as const,
          })
        }

        mockData.push({
          date: day,
          income,
          expenses,
          events,
        })
      }
    })

    setFinancialData(mockData)
  }

  // Generate mock data if no initial data is provided
  if (financialData.length === 0) {
    generateMockData()
  }

  return (
    <WidgetLayout className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Financial Calendar</CardTitle>
          <CardDescription>Track your daily financial activities</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={previousMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">{format(currentDate, "MMMM yyyy")}</div>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day, dayIdx) => {
            // Get financial data for this day
            const dayData = getDayData(day)

            return (
              <TooltipProvider key={dayIdx}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "aspect-square p-1",
                        !isSameMonth(day, currentDate) && "opacity-50",
                        isToday(day) && "bg-primary/10 rounded-md",
                      )}
                    >
                      <div
                        className={cn("flex h-full flex-col justify-between rounded-md p-1", dayData && "bg-muted/50")}
                      >
                        <div className="text-right text-xs">{format(day, "d")}</div>
                        <DayContent dayData={dayData} />
                      </div>
                    </div>
                  </TooltipTrigger>
                  {dayData && (
                    <TooltipContent className="w-64 p-0">
                      <Card className="border-0 shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{format(day, "MMMM d, yyyy")}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                          {dayData.events && dayData.events.length > 0 ? (
                            <div className="space-y-2">
                              {dayData.events.map((event) => (
                                <div key={event.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    {event.type === "income" ? (
                                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                                    )}
                                    <span>{event.title}</span>
                                  </div>
                                  <span
                                    className={cn(
                                      "font-medium",
                                      event.type === "income" ? "text-green-500" : "text-red-500",
                                    )}
                                  >
                                    {event.type === "income" ? "+" : "-"}${event.amount.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No financial activities on this day.</div>
                          )}
                        </CardContent>
                      </Card>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </CardContent>
    </WidgetLayout>
  )
}

// Component to display day content with proper null checks
function DayContent({ dayData }: { dayData?: FinancialDayData }) {
  // Return empty div if no data is available
  if (!dayData) {
    return <div className="mt-auto" />
  }

  const hasIncome = dayData.income && dayData.income > 0
  const hasExpenses = dayData.expenses && dayData.expenses > 0

  return (
    <div className="mt-auto flex flex-col gap-0.5">
      {hasIncome && (
        <div className="flex items-center justify-end gap-0.5 text-[10px] text-green-500">
          <DollarSign className="h-2.5 w-2.5" />
          <span>{dayData.income}</span>
        </div>
      )}
      {hasExpenses && (
        <div className="flex items-center justify-end gap-0.5 text-[10px] text-red-500">
          <DollarSign className="h-2.5 w-2.5" />
          <span>{dayData.expenses}</span>
        </div>
      )}
      {!hasIncome && !hasExpenses && (
        <div className="flex items-center justify-end gap-0.5 text-[10px] text-muted-foreground">
          <span>0</span>
        </div>
      )}
    </div>
  )
}

