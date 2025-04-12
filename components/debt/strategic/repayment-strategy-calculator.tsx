"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { Info, Plus, Trash2 } from "lucide-react"
import {
  Tooltip as TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Debt {
  id: string
  name: string
  balance: number
  interestRate: number
  minimumPayment: number
}

interface PayoffResult {
  strategy: string
  totalInterest: number
  totalPayments: number
  monthsToPayoff: number
  debtFreeDate: Date
  monthlyPayments: {
    month: number
    payment: number
    remainingBalance: number
  }[]
}

export function RepaymentStrategyCalculator() {
  const [strategy, setStrategy] = useState<"avalanche" | "snowball" | "hybrid">("avalanche")
  const [extraPayment, setExtraPayment] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<PayoffResult[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  
  // Form state for adding new debts
  const [newDebt, setNewDebt] = useState({
    name: "",
    balance: 5000,
    interestRate: 5,
    minimumPayment: 100
  })

  useEffect(() => {
    if (debts.length > 0) {
      calculatePayoffResults()
    }
  }, [strategy, extraPayment, debts])

  const calculatePayoffResults = () => {
    setLoading(true)
    setError(null)
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        const results: PayoffResult[] = [
          calculateStrategy("avalanche"),
          calculateStrategy("snowball"),
          calculateStrategy("hybrid")
        ]
        
        setResults(results)
        setLoading(false)
      } catch (err) {
        setError("Failed to calculate payoff results. Please try again.")
        setLoading(false)
      }
    }, 1000)
  }

  const calculateStrategy = (strategyType: "avalanche" | "snowball" | "hybrid"): PayoffResult => {
    // Create a copy of debts to avoid modifying the original
    let remainingDebts = [...debts]
    let totalInterest = 0
    let totalPayments = 0
    let month = 1
    const monthlyPayments: { month: number; payment: number; remainingBalance: number }[] = []
    
    // Calculate total minimum payments
    const totalMinimumPayments = remainingDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0)
    const totalMonthlyPayment = totalMinimumPayments + extraPayment
    
    // Continue until all debts are paid off
    while (remainingDebts.length > 0 && month <= 360) { // Cap at 30 years
      let remainingPayment = totalMonthlyPayment
      
      // First, make minimum payments on all debts
      remainingDebts = remainingDebts.map(debt => {
        const interestPayment = debt.balance * (debt.interestRate / 100 / 12)
        const principalPayment = Math.min(debt.minimumPayment, debt.balance + interestPayment)
        const newBalance = debt.balance + interestPayment - principalPayment
        
        totalInterest += interestPayment
        totalPayments += principalPayment + interestPayment
        remainingPayment -= (principalPayment + interestPayment)
        
        return {
          ...debt,
          balance: newBalance
        }
      })
      
      // Then, apply extra payment based on strategy
      if (remainingPayment > 0) {
        if (strategyType === "avalanche") {
          // Pay extra on highest interest rate debt
          remainingDebts.sort((a, b) => b.interestRate - a.interestRate)
        } else if (strategyType === "snowball") {
          // Pay extra on smallest balance debt
          remainingDebts.sort((a, b) => a.balance - b.balance)
        } else if (strategyType === "hybrid") {
          // Hybrid approach: prioritize high interest but also consider balance
          remainingDebts.sort((a, b) => {
            // Calculate a score based on both interest rate and balance
            const scoreA = a.interestRate * (1 + a.balance / 10000)
            const scoreB = b.interestRate * (1 + b.balance / 10000)
            return scoreB - scoreA
          })
        }
        
        // Apply remaining payment to the first debt (highest priority)
        if (remainingDebts.length > 0) {
          const debt = remainingDebts[0]
          const payment = Math.min(remainingPayment, debt.balance)
          debt.balance -= payment
          totalPayments += payment
          remainingPayment -= payment
        }
      }
      
      // Record monthly payment and remaining balance
      const totalRemainingBalance = remainingDebts.reduce((sum, debt) => sum + debt.balance, 0)
      monthlyPayments.push({
        month,
        payment: totalMonthlyPayment,
        remainingBalance: totalRemainingBalance
      })
      
      // Remove paid off debts
      remainingDebts = remainingDebts.filter(debt => debt.balance > 0)
      
      month++
    }
    
    // Calculate debt-free date
    const debtFreeDate = new Date()
    debtFreeDate.setMonth(debtFreeDate.getMonth() + month - 1)
    
    return {
      strategy: strategyType,
      totalInterest,
      totalPayments,
      monthsToPayoff: month - 1,
      debtFreeDate,
      monthlyPayments
    }
  }

  const addDebt = () => {
    if (!newDebt.name.trim()) {
      alert("Please enter a name for the debt")
      return
    }
    
    if (newDebt.balance <= 0) {
      alert("Balance must be greater than 0")
      return
    }
    
    if (newDebt.minimumPayment <= 0) {
      alert("Minimum payment must be greater than 0")
      return
    }
    
    const newDebtWithId = {
      ...newDebt,
      id: `debt-${Date.now()}`
    }
    
    setDebts(prevDebts => [...prevDebts, newDebtWithId])
    
    // Reset form
    setNewDebt({
      name: "",
      balance: 5000,
      interestRate: 5,
      minimumPayment: 100
    })
  }

  const removeDebt = (id: string) => {
    setDebts(prevDebts => prevDebts.filter(debt => debt.id !== id))
  }

  const getBestStrategy = () => {
    if (results.length === 0) return null
    
    // Find the strategy with the lowest total interest
    return results.reduce((best, current) => 
      current.totalInterest < best.totalInterest ? current : best
    )
  }

  const bestStrategy = getBestStrategy()
  const selectedStrategy = results.find(r => r.strategy === strategy) || results[0]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Repayment Strategy Calculator</CardTitle>
          <CardDescription>
            Add your debts and compare different repayment strategies to find the most efficient way to become debt-free.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="debt-name">Debt Name</Label>
                <Input
                  id="debt-name"
                  placeholder="e.g., Credit Card, Car Loan"
                  value={newDebt.name}
                  onChange={(e) => setNewDebt(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="debt-balance">Balance</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="debt-balance"
                    min={100}
                    max={50000}
                    step={100}
                    value={[newDebt.balance]}
                    onValueChange={(value) => setNewDebt(prev => ({ ...prev, balance: value[0] }))}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={newDebt.balance}
                    onChange={(e) => setNewDebt(prev => ({ ...prev, balance: Number(e.target.value) }))}
                    className="w-24"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="interest-rate"
                    min={1}
                    max={30}
                    step={0.25}
                    value={[newDebt.interestRate]}
                    onValueChange={(value) => setNewDebt(prev => ({ ...prev, interestRate: value[0] }))}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={newDebt.interestRate}
                    onChange={(e) => setNewDebt(prev => ({ ...prev, interestRate: Number(e.target.value) }))}
                    className="w-20"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minimum-payment">Minimum Payment</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="minimum-payment"
                    min={10}
                    max={1000}
                    step={10}
                    value={[newDebt.minimumPayment]}
                    onValueChange={(value) => setNewDebt(prev => ({ ...prev, minimumPayment: value[0] }))}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={newDebt.minimumPayment}
                    onChange={(e) => setNewDebt(prev => ({ ...prev, minimumPayment: Number(e.target.value) }))}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={addDebt}>
                <Plus className="mr-2 h-4 w-4" />
                Add Debt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Debts</CardTitle>
            <CardDescription>
              Here are all the debts you've added. You can remove any debt by clicking the trash icon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left text-sm font-medium">Debt Name</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Balance</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Interest Rate</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Minimum Payment</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map((debt) => (
                    <tr key={debt.id} className="border-b">
                      <td className="px-4 py-2 text-sm">{debt.name}</td>
                      <td className="px-4 py-2 text-right text-sm">{formatCurrency(debt.balance)}</td>
                      <td className="px-4 py-2 text-right text-sm">{formatPercentage(debt.interestRate)}</td>
                      <td className="px-4 py-2 text-right text-sm">{formatCurrency(debt.minimumPayment)}</td>
                      <td className="px-4 py-2 text-right text-sm">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeDebt(debt.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-medium">
                    <td className="px-4 py-2 text-sm">Total</td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(debts.reduce((sum, debt) => sum + debt.balance, 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatPercentage(
                        debts.reduce((sum, debt) => sum + debt.balance * debt.interestRate, 0) / 
                        debts.reduce((sum, debt) => sum + debt.balance, 0)
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(debts.reduce((sum, debt) => sum + debt.minimumPayment, 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-sm"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Repayment Strategy</CardTitle>
            <CardDescription>
              Choose a repayment strategy and add extra payment to see how it affects your payoff timeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="space-y-4">
                <Label>Strategy</Label>
                <RadioGroup
                  value={strategy}
                  onValueChange={(value) => setStrategy(value as "avalanche" | "snowball" | "hybrid")}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="avalanche" id="avalanche" />
                    <Label htmlFor="avalanche" className="flex-1">
                      <div className="font-medium">Avalanche</div>
                      <div className="text-sm text-muted-foreground">
                        Pay highest interest rate first
                      </div>
                    </Label>
                    <TooltipProvider>
                      <TooltipComponent>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The avalanche method prioritizes paying off debts with the highest interest rates first.</p>
                          <p>This strategy minimizes the total interest paid over time.</p>
                        </TooltipContent>
                      </TooltipComponent>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="snowball" id="snowball" />
                    <Label htmlFor="snowball" className="flex-1">
                      <div className="font-medium">Snowball</div>
                      <div className="text-sm text-muted-foreground">
                        Pay smallest balance first
                      </div>
                    </Label>
                    <TooltipProvider>
                      <TooltipComponent>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The snowball method prioritizes paying off debts with the smallest balances first.</p>
                          <p>This strategy provides psychological motivation by quickly eliminating debts.</p>
                        </TooltipContent>
                      </TooltipComponent>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="hybrid" id="hybrid" />
                    <Label htmlFor="hybrid" className="flex-1">
                      <div className="font-medium">Hybrid</div>
                      <div className="text-sm text-muted-foreground">
                        Balance of both approaches
                      </div>
                    </Label>
                    <TooltipProvider>
                      <TooltipComponent>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The hybrid method balances interest rates and debt balances.</p>
                          <p>This strategy aims to optimize both financial and psychological benefits.</p>
                        </TooltipContent>
                      </TooltipComponent>
                    </TooltipProvider>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="extra-payment">Extra Monthly Payment</Label>
                  <span className="text-sm font-medium">{formatCurrency(extraPayment)}</span>
                </div>
                <Slider
                  id="extra-payment"
                  min={0}
                  max={2000}
                  step={50}
                  value={[extraPayment]}
                  onValueChange={(value) => setExtraPayment(value[0])}
                />
                <div className="flex justify-end">
                  <Input
                    type="number"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(Number(e.target.value))}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-sm text-muted-foreground">Calculating repayment strategies...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex h-[200px] items-center justify-center">
            <div className="text-center text-destructive">
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : results.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Strategy Comparison</CardTitle>
            <CardDescription>
              See how different repayment strategies compare in terms of total interest, time to debt-free, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4">
                <div className="grid gap-6 md:grid-cols-3">
                  {results.map((result) => (
                    <Card key={result.strategy} className={bestStrategy?.strategy === result.strategy ? "border-2 border-primary" : ""}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg capitalize">{result.strategy} Strategy</CardTitle>
                        <CardDescription>
                          {result.strategy === "avalanche" 
                            ? "Highest interest rate first" 
                            : result.strategy === "snowball" 
                              ? "Smallest balance first" 
                              : "Balance of both approaches"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Interest:</span>
                            <span className="font-medium">{formatCurrency(result.totalInterest)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Payments:</span>
                            <span className="font-medium">{formatCurrency(result.totalPayments)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Months to Payoff:</span>
                            <span className="font-medium">{result.monthsToPayoff}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Debt-Free Date:</span>
                            <span className="font-medium">
                              {result.debtFreeDate.toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {bestStrategy && (
                  <div className="mt-6">
                    <Card className="bg-primary/5">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Best Strategy</h4>
                            <p className="mt-1 text-sm text-muted-foreground capitalize">
                              {bestStrategy.strategy} Strategy
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(bestStrategy.totalInterest)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Interest</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="comparison" className="mt-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Total Interest Comparison",
                          ...results.reduce((acc, result) => ({
                            ...acc,
                            [result.strategy]: result.totalInterest,
                          }), {}),
                        },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: "Total Interest", angle: -90, position: "insideLeft" }} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      {results.map((result, index) => (
                        <Bar 
                          key={result.strategy} 
                          dataKey={result.strategy} 
                          fill={index === 0 ? "#3b82f6" : index === 1 ? "#10b981" : "#f59e0b"} 
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-medium">Months to Payoff Comparison</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Months to Payoff",
                            ...results.reduce((acc, result) => ({
                              ...acc,
                              [result.strategy]: result.monthsToPayoff,
                            }), {}),
                          },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: "Months", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        {results.map((result, index) => (
                          <Bar 
                            key={result.strategy} 
                            dataKey={result.strategy} 
                            fill={index === 0 ? "#3b82f6" : index === 1 ? "#10b981" : "#f59e0b"} 
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-medium">Debt Distribution</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={debts.map(debt => ({
                            name: debt.name,
                            value: debt.balance
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {debts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Balance Reduction Over Time</h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="strategy-select">Select Strategy:</Label>
                      <select
                        id="strategy-select"
                        className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={strategy}
                        onChange={(e) => setStrategy(e.target.value as "avalanche" | "snowball" | "hybrid")}
                      >
                        {results.map(result => (
                          <option key={result.strategy} value={result.strategy}>
                            {result.strategy.charAt(0).toUpperCase() + result.strategy.slice(1)} Strategy
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={selectedStrategy?.monthlyPayments || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: "Months", position: "bottom" }} />
                        <YAxis label={{ value: "Amount", angle: -90, position: "insideLeft" }} />
                        <Tooltip
                          formatter={(value) => formatCurrency(value as number)}
                          labelFormatter={(label) => `Month ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="remainingBalance"
                          name="Remaining Balance"
                          stroke="#3b82f6"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-2 text-left text-sm font-medium">Month</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Payment</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStrategy?.monthlyPayments.slice(0, 12).map((row) => (
                          <tr key={row.month} className="border-b">
                            <td className="px-4 py-2 text-sm">{row.month}</td>
                            <td className="px-4 py-2 text-right text-sm">{formatCurrency(row.payment)}</td>
                            <td className="px-4 py-2 text-right text-sm">{formatCurrency(row.remainingBalance)}</td>
                          </tr>
                        ))}
                        <tr className="bg-muted/50 font-medium">
                          <td className="px-4 py-2 text-sm">...</td>
                          <td className="px-4 py-2 text-right text-sm">...</td>
                          <td className="px-4 py-2 text-right text-sm">...</td>
                        </tr>
                        {selectedStrategy?.monthlyPayments.slice(-12).map((row) => (
                          <tr key={row.month} className="border-b">
                            <td className="px-4 py-2 text-sm">{row.month}</td>
                            <td className="px-4 py-2 text-right text-sm">{formatCurrency(row.payment)}</td>
                            <td className="px-4 py-2 text-right text-sm">{formatCurrency(row.remainingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : debts.length === 0 ? (
        <Card>
          <CardContent className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Add debts to see repayment strategy results.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
} 