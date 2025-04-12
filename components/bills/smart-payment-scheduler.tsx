import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InfoIcon, CalendarIcon, ClockIcon, TrendingUpIcon, CheckCircleIcon, PieChartIcon } from "lucide-react"
import { supabaseClient } from "@/lib/supabase"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts"

interface Bill {
  id: string
  name: string
  category: string
  amount: number
  due_date: string
  is_recurring: boolean
  frequency: string
  payment_method: string
  status: string
}

interface Subscription {
  id: string
  name: string
  category: string
  cost: number
  billing_cycle: string
  next_billing_date: string
  payment_method: string
}

interface PaymentSchedule {
  date: string
  amount: number
  items: {
    id: string
    name: string
    amount: number
    type: "bill" | "subscription"
    category: string
  }[]
}

interface CashFlowProjection {
  date: string
  balance: number
  income: number
  expenses: number
}

interface CategoryExpense {
  name: string
  value: number
  color: string
}

// Define static expense categories with colors
const EXPENSE_CATEGORIES = [
  { name: "Housing", color: "#8884d8" },
  { name: "Utilities", color: "#82ca9d" },
  { name: "Insurance", color: "#ffc658" },
  { name: "Transportation", color: "#ff8042" },
  { name: "Food", color: "#0088fe" },
  { name: "Healthcare", color: "#00c49f" },
  { name: "Entertainment", color: "#ffbb28" },
  { name: "Education", color: "#a4de6c" },
  { name: "Personal Care", color: "#d0ed57" },
  { name: "Savings", color: "#8dd1e1" },
  { name: "Debt Payments", color: "#ff7c43" },
  { name: "Other", color: "#c6dbef" }
]

export function SmartPaymentScheduler() {
  const [bills, setBills] = useState<Bill[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule[]>([])
  const [cashFlowProjection, setCashFlowProjection] = useState<CashFlowProjection[]>([])
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("calendar")
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [monthlyIncome, setMonthlyIncome] = useState(5000) // Default monthly income
  const [optimizationStrategy, setOptimizationStrategy] = useState("balanced")

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (bills.length > 0 || subscriptions.length > 0) {
      generatePaymentSchedule()
      generateCashFlowProjection()
      calculateCategoryExpenses()
    }
  }, [bills, subscriptions, selectedMonth, monthlyIncome, optimizationStrategy])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch bills
      const { data: billsData, error: billsError } = await supabaseClient
        .from('bills')
        .select('*')
        .eq('is_recurring', true)
      
      if (billsError) throw billsError
      
      // Fetch subscriptions
      const { data: subsData, error: subsError } = await supabaseClient
        .from('subscriptions')
        .select('*')
      
      if (subsError) throw subsError
      
      setBills(billsData || [])
      setSubscriptions(subsData || [])
      
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generatePaymentSchedule = () => {
    // Get the start and end of the selected month
    const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
    const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
    
    // Create a map to group payments by date
    const scheduleMap = new Map<string, PaymentSchedule>()
    
    // Add bills to the schedule
    bills.forEach(bill => {
      const dueDate = new Date(bill.due_date)
      
      // Check if the bill is due in the selected month
      if (dueDate >= startDate && dueDate <= endDate) {
        const dateKey = dueDate.toISOString().split('T')[0]
        
        if (!scheduleMap.has(dateKey)) {
          scheduleMap.set(dateKey, {
            date: dateKey,
            amount: 0,
            items: []
          })
        }
        
        const schedule = scheduleMap.get(dateKey)!
        schedule.amount += bill.amount
        schedule.items.push({
          id: bill.id,
          name: bill.name,
          amount: bill.amount,
          type: "bill",
          category: bill.category || "Other"
        })
      }
    })
    
    // Add subscriptions to the schedule
    subscriptions.forEach(subscription => {
      const nextBillingDate = new Date(subscription.next_billing_date)
      
      // Check if the subscription is due in the selected month
      if (nextBillingDate >= startDate && nextBillingDate <= endDate) {
        const dateKey = nextBillingDate.toISOString().split('T')[0]
        
        if (!scheduleMap.has(dateKey)) {
          scheduleMap.set(dateKey, {
            date: dateKey,
            amount: 0,
            items: []
          })
        }
        
        const schedule = scheduleMap.get(dateKey)!
        schedule.amount += subscription.cost
        schedule.items.push({
          id: subscription.id,
          name: subscription.name,
          amount: subscription.cost,
          type: "subscription",
          category: subscription.category || "Other"
        })
      }
    })
    
    // Convert the map to an array and sort by date
    const schedule = Array.from(scheduleMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    // Apply optimization strategy
    if (optimizationStrategy === "early") {
      // Move payments to the beginning of the month
      schedule.forEach(item => {
        const date = new Date(item.date)
        date.setDate(5) // Move to the 5th of the month
        item.date = date.toISOString().split('T')[0]
      })
    } else if (optimizationStrategy === "late") {
      // Move payments to the end of the month
      schedule.forEach(item => {
        const date = new Date(item.date)
        date.setDate(25) // Move to the 25th of the month
        item.date = date.toISOString().split('T')[0]
      })
    }
    
    // Re-sort after optimization
    schedule.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    setPaymentSchedule(schedule)
  }

  const calculateCategoryExpenses = () => {
    // Initialize category expenses with zero values
    const initialCategories = EXPENSE_CATEGORIES.map(category => ({
      name: category.name,
      value: 0,
      color: category.color
    }))
    
    // Calculate expenses by category
    const categoryMap = new Map<string, number>()
    
    // Process all items in the payment schedule
    paymentSchedule.forEach(schedule => {
      schedule.items.forEach(item => {
        const category = item.category || "Other"
        const currentValue = categoryMap.get(category) || 0
        categoryMap.set(category, currentValue + item.amount)
      })
    })
    
    // Update the category expenses
    const updatedCategories = initialCategories.map(category => {
      const value = categoryMap.get(category.name) || 0
      return {
        ...category,
        value
      }
    })
    
    // Filter out categories with zero value
    const nonZeroCategories = updatedCategories.filter(category => category.value > 0)
    
    setCategoryExpenses(nonZeroCategories)
  }

  const generateCashFlowProjection = () => {
    // Get the start and end of the selected month
    const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
    const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
    
    // Create a projection for each day of the month
    const projection: CashFlowProjection[] = []
    
    // Assume income arrives on the 1st and 15th of the month
    const incomeDates = [
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1),
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 15)
    ]
    
    // Calculate total expenses for the month
    const totalExpenses = paymentSchedule.reduce((sum, item) => sum + item.amount, 0)
    
    // Distribute expenses across the month based on the optimization strategy
    let remainingExpenses = totalExpenses
    let dayCount = 0
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      const isIncomeDay = incomeDates.some(date => 
        date.getDate() === d.getDate() && 
        date.getMonth() === d.getMonth() && 
        date.getFullYear() === d.getFullYear()
      )
      
      // Calculate income for this day
      const income = isIncomeDay ? monthlyIncome / 2 : 0
      
      // Calculate expenses for this day
      let expenses = 0
      
      if (optimizationStrategy === "early") {
        // Front-load expenses
        if (dayCount < 10) {
          expenses = remainingExpenses / (10 - dayCount)
          remainingExpenses -= expenses
        }
      } else if (optimizationStrategy === "late") {
        // Back-load expenses
        const daysLeft = endDate.getDate() - d.getDate() + 1
        if (daysLeft <= 10) {
          expenses = remainingExpenses / daysLeft
          remainingExpenses -= expenses
        }
      } else {
        // Balanced approach - distribute evenly
        expenses = totalExpenses / endDate.getDate()
      }
      
      // Find payments scheduled for this day
      const scheduledPayments = paymentSchedule.filter(item => item.date === dateKey)
      if (scheduledPayments.length > 0) {
        expenses = scheduledPayments.reduce((sum, item) => sum + item.amount, 0)
      }
      
      // Calculate balance
      const previousBalance = projection.length > 0 
        ? projection[projection.length - 1].balance 
        : 0
      
      const balance = previousBalance + income - expenses
      
      projection.push({
        date: dateKey,
        balance,
        income,
        expenses
      })
      
      dayCount++
    }
    
    setCashFlowProjection(projection)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const handleMonthChange = (date: Date | undefined) => {
    if (date) {
      setSelectedMonth(date)
    }
  }

  const handleStrategyChange = (value: string) => {
    setOptimizationStrategy(value)
  }

  const getCategoryColor = (categoryName: string) => {
    const category = EXPENSE_CATEGORIES.find(cat => cat.name === categoryName)
    return category ? category.color : "#c6dbef" // Default to "Other" color
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-500" />
          Smart Payment Scheduler
        </CardTitle>
        <CardDescription>
          Optimize your payment schedule to improve cash flow
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Monthly Income</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Optimization Strategy</label>
                <Select value={optimizationStrategy} onValueChange={handleStrategyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="early">Early Payments</SelectItem>
                    <SelectItem value="late">Late Payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Selected Month</label>
                <div className="text-lg font-medium">{getMonthName(selectedMonth)}</div>
              </div>
            </div>
            
            <Tabs defaultValue="calendar" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="calendar" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      onSelect={handleMonthChange}
                      className="rounded-md border"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium mb-4">Payment Schedule for {getMonthName(selectedMonth)}</h3>
                    
                    {paymentSchedule.length === 0 ? (
                      <Alert>
                        <InfoIcon className="h-5 w-5" />
                        <AlertTitle>No payments scheduled</AlertTitle>
                        <AlertDescription>
                          There are no bills or subscriptions due in the selected month.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        {paymentSchedule.map((schedule, index) => (
                          <Card key={index} className="overflow-hidden">
                            <div className="p-4 border-b">
                              <div className="flex justify-between items-center">
                                <div className="font-medium">{formatDate(schedule.date)}</div>
                                <div className="font-bold">{formatCurrency(schedule.amount)}</div>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <ul className="space-y-2">
                                {schedule.items.map((item, itemIndex) => (
                                  <li key={itemIndex} className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getCategoryColor(item.category) }}></span>
                                      <span>{item.name}</span>
                                      <span className="text-xs text-muted-foreground">({item.category})</span>
                                    </div>
                                    <span>{formatCurrency(item.amount)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Payment Timeline</h3>
                
                {paymentSchedule.length === 0 ? (
                  <Alert>
                    <InfoIcon className="h-5 w-5" />
                    <AlertTitle>No payments scheduled</AlertTitle>
                    <AlertDescription>
                      There are no bills or subscriptions due in the selected month.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={paymentSchedule}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return date.getDate().toString()
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
                          labelFormatter={(label) => formatDate(label)}
                        />
                        <Legend />
                        <Bar dataKey="amount" name="Payment Amount" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="cashflow" className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Cash Flow Projection</h3>
                
                {cashFlowProjection.length === 0 ? (
                  <Alert>
                    <InfoIcon className="h-5 w-5" />
                    <AlertTitle>No cash flow data</AlertTitle>
                    <AlertDescription>
                      There are no payments scheduled in the selected month.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={cashFlowProjection}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return date.getDate().toString()
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
                          labelFormatter={(label) => formatDate(label)}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          name="Account Balance" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="income" 
                          name="Income" 
                          stroke="#82ca9d" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="expenses" 
                          name="Expenses" 
                          stroke="#ff8042" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-2">Strategy Recommendations</h4>
                  
                  {optimizationStrategy === "balanced" && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <InfoIcon className="h-5 w-5 text-blue-500" />
                      <AlertTitle>Balanced Strategy</AlertTitle>
                      <AlertDescription>
                        Payments are scheduled on their original due dates. This approach maintains your current payment schedule but may result in uneven cash flow.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {optimizationStrategy === "early" && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <AlertTitle>Early Payments Strategy</AlertTitle>
                      <AlertDescription>
                        Payments are moved to the beginning of the month. This approach helps you get bills out of the way early and may improve your credit score, but requires having funds available at the start of the month.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {optimizationStrategy === "late" && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <ClockIcon className="h-5 w-5 text-yellow-500" />
                      <AlertTitle>Late Payments Strategy</AlertTitle>
                      <AlertDescription>
                        Payments are moved to the end of the month. This approach maximizes the time your money stays in your account, but may result in a larger outflow at the end of the month.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="categories" className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Expense Categories</h3>
                
                {categoryExpenses.length === 0 ? (
                  <Alert>
                    <InfoIcon className="h-5 w-5" />
                    <AlertTitle>No expense data</AlertTitle>
                    <AlertDescription>
                      There are no expenses scheduled in the selected month.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-80">
                        <h4 className="text-md font-medium mb-2">Expense Distribution</h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryExpenses}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {categoryExpenses.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium mb-2">Category Breakdown</h4>
                        <div className="space-y-2">
                          {categoryExpenses.map((category, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></span>
                                <span>{category.name}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(category.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-md font-medium mb-2">Category Insights</h4>
                      
                      {categoryExpenses.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">Largest Expense Category</div>
                              <div className="text-xl font-bold">
                                {categoryExpenses.sort((a, b) => b.value - a.value)[0].name}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {formatCurrency(categoryExpenses.sort((a, b) => b.value - a.value)[0].value)}
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm text-muted-foreground">Percentage of Income</div>
                              <div className="text-xl font-bold">
                                {((categoryExpenses.reduce((sum, cat) => sum + cat.value, 0) / monthlyIncome) * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {formatCurrency(categoryExpenses.reduce((sum, cat) => sum + cat.value, 0))} of {formatCurrency(monthlyIncome)}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
} 