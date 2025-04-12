"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getExpensesByPeriod } from "@/app/actions/expenses"
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InteractiveTimelineProps {
  className?: string
}

interface TimelineData {
  date: string
  amount: number
  count: number
  categories: {
    [key: string]: {
      name: string
      amount: number
      color: string
    }
  }
}

export function InteractiveTimeline({ className }: InteractiveTimelineProps) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timelineData, setTimelineData] = useState<TimelineData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<"3m" | "6m" | "1y">("3m")
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [maxAmount, setMaxAmount] = useState(0)

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true)
      try {
        let period: "day" | "week" | "month" | "year" = "month"
        if (selectedPeriod === "3m" || selectedPeriod === "6m") {
          period = "month"
        } else if (selectedPeriod === "1y") {
          period = "year"
        }
        
        const data = await getExpensesByPeriod(period)
        setExpenses(data)
        
        // Process data for timeline
        const months = []
        const now = new Date()
        let monthsToShow = 3
        
        if (selectedPeriod === "6m") {
          monthsToShow = 6
        } else if (selectedPeriod === "1y") {
          monthsToShow = 12
        }
        
        for (let i = 0; i < monthsToShow; i++) {
          const monthDate = subMonths(now, i)
          const start = startOfMonth(monthDate)
          const end = endOfMonth(monthDate)
          
          const monthExpenses = data.filter(expense => {
            // Add null check and handle both date and spent_at fields
            if (!expense.date && !expense.spent_at) return false;
            
            try {
              // Try to parse the date, handling both date and spent_at fields
              const dateString = expense.date || expense.spent_at;
              const expenseDate = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
              return expenseDate >= start && expenseDate <= end;
            } catch (error) {
              console.error("Error parsing date:", error, expense);
              return false;
            }
          })
          
          const amount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
          
          // Group by category
          const categories: { [key: string]: { name: string, amount: number, color: string } } = {}
          
          monthExpenses.forEach(expense => {
            if (expense.category) {
              const categoryId = expense.category.id
              if (!categories[categoryId]) {
                categories[categoryId] = {
                  name: expense.category.name,
                  amount: 0,
                  color: expense.category.color || "#888888"
                }
              }
              categories[categoryId].amount += expense.amount
            }
          })
          
          months.push({
            date: format(start, "yyyy-MM"),
            amount,
            count: monthExpenses.length,
            categories
          })
        }
        
        // Sort by date (oldest to newest)
        months.sort((a, b) => a.date.localeCompare(b.date))
        
        setTimelineData(months)
        setMaxAmount(Math.max(...months.map(m => m.amount), 1))
      } catch (error) {
        console.error("Error fetching expenses:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchExpenses()
  }, [selectedPeriod])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatMonth = (dateString: string) => {
    return format(parseISO(dateString + "-01"), "MMM yyyy")
  }

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Spending Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Spending Timeline</CardTitle>
        <Tabs defaultValue="3m" onValueChange={(value) => setSelectedPeriod(value as "3m" | "6m" | "1y")}>
          <TabsList>
            <TabsTrigger value="3m">3 Months</TabsTrigger>
            <TabsTrigger value="6m">6 Months</TabsTrigger>
            <TabsTrigger value="1y">1 Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end space-x-2">
          {timelineData.map((month) => (
            <div 
              key={month.date}
              className="flex-1 flex flex-col items-center"
              onMouseEnter={() => setHoveredDate(month.date)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <div 
                className="w-full bg-blue-500 rounded-t-sm transition-all"
                style={{ 
                  height: `${(month.amount / maxAmount) * 100}%`,
                  minHeight: month.amount > 0 ? "4px" : "0"
                }}
              ></div>
              <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                {formatMonth(month.date)}
              </div>
            </div>
          ))}
        </div>
        
        {hoveredDate && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-gray-900 dark:text-gray-100">
            <h3 className="font-medium">{formatMonth(hoveredDate)}</h3>
            <div className="mt-1">
              <p>Total spent: {formatCurrency(timelineData.find(m => m.date === hoveredDate)?.amount || 0)}</p>
              <p>Transactions: {timelineData.find(m => m.date === hoveredDate)?.count || 0}</p>
              
              <div className="mt-2">
                <h4 className="text-sm font-medium">By Category:</h4>
                <div className="mt-1 space-y-1">
                  {Object.values(timelineData.find(m => m.date === hoveredDate)?.categories || {}).map((category, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span>{category.name}</span>
                      </div>
                      <span>{formatCurrency(category.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 