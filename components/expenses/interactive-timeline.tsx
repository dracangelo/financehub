"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getExpensesByPeriod } from "@/app/actions/expenses"
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isSameMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { BarChart, TrendingUp, TrendingDown } from "lucide-react"

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [maxAmount, setMaxAmount] = useState(0)
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral')

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
              const categoryId = expense.category.id || expense.category
              const categoryName = typeof expense.category === 'string' 
                ? expense.category 
                : (expense.category.name || 'Uncategorized')
              const categoryColor = typeof expense.category === 'string' 
                ? '#888888' 
                : (expense.category.color || '#888888')
                
              if (!categories[categoryId]) {
                categories[categoryId] = {
                  name: categoryName,
                  amount: 0,
                  color: categoryColor
                }
              }
              categories[categoryId].amount += expense.amount
            } else {
              // Handle uncategorized expenses
              const categoryId = 'uncategorized'
              if (!categories[categoryId]) {
                categories[categoryId] = {
                  name: 'Uncategorized',
                  amount: 0,
                  color: '#888888'
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
        
        // Calculate spending trend
        if (months.length >= 2) {
          const currentMonth = months[months.length - 1].amount;
          const previousMonth = months[months.length - 2].amount;
          
          if (currentMonth > previousMonth) {
            setTrend('up');
          } else if (currentMonth < previousMonth) {
            setTrend('down');
          } else {
            setTrend('neutral');
          }
        }
        
        setTimelineData(months)
        setMaxAmount(Math.max(...months.map(m => m.amount), 1))
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
    window.addEventListener('expense_updated', () => fetchExpenses())
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('expense_updated', () => fetchExpenses())
    }
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
        <div className="flex items-center gap-2">
          <CardTitle>Spending Timeline</CardTitle>
          {trend !== 'neutral' && (
            <Badge variant={trend === 'down' ? "success" : "destructive"} className="flex items-center gap-1">
              {trend === 'down' ? (
                <>
                  <TrendingDown className="h-3 w-3" />
                  <span>Decreasing</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3" />
                  <span>Increasing</span>
                </>
              )}
            </Badge>
          )}
        </div>
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
            <TooltipProvider key={month.date}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "flex-1 flex flex-col items-center cursor-pointer",
                      selectedDate === month.date && "ring-2 ring-primary ring-offset-2 rounded-t"
                    )}
                    onMouseEnter={() => setHoveredDate(month.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    onClick={() => setSelectedDate(selectedDate === month.date ? null : month.date)}
                  >
                    <div 
                      className={cn(
                        "w-full rounded-t-sm transition-all",
                        selectedDate === month.date ? "bg-primary" : "bg-blue-500"
                      )}
                      style={{ 
                        height: `${(month.amount / maxAmount) * 100}%`,
                        minHeight: month.amount > 0 ? "4px" : "0"
                      }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                      {formatMonth(month.date)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="p-0 bg-transparent border-0 shadow-none">
                  <Card className="w-64 shadow-lg">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-sm">{formatMonth(month.date)}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span>Total spent:</span>
                        <span>{formatCurrency(month.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Transactions:</span>
                        <span>{month.count}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        
        {selectedDate && (
          <div className="mt-4 p-4 bg-card rounded-md border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-lg">{formatMonth(selectedDate)}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <BarChart className="h-3 w-3" />
                  <span>{timelineData.find(m => m.date === selectedDate)?.count || 0} transactions</span>
                </Badge>
                <Badge variant="secondary" className="font-medium">
                  {formatCurrency(timelineData.find(m => m.date === selectedDate)?.amount || 0)}
                </Badge>
              </div>
            </div>
            
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-2">Spending by Category:</h4>
              <div className="space-y-2">
                {Object.values(timelineData.find(m => m.date === selectedDate)?.categories || {})
                  .sort((a, b) => b.amount - a.amount)
                  .map((category, i) => {
                    const percentage = timelineData.find(m => m.date === selectedDate)?.amount
                      ? Math.round((category.amount / (timelineData.find(m => m.date === selectedDate)?.amount || 1)) * 100)
                      : 0;
                    
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span>{category.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{percentage}%</span>
                            <span className="font-medium">{formatCurrency(category.amount)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: category.color 
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 