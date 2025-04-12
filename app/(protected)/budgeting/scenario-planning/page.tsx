"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, Copy, Play } from "lucide-react"
import Link from "next/link"
import { BudgetWaterfallChart } from "@/components/budgeting/budget-waterfall-chart"

export default function ScenarioPlanningPage() {
  const [scenarios, setScenarios] = useState([
    {
      id: "1",
      name: "Current Budget",
      description: "Your current budget allocation",
      isBaseline: true,
      income: 5000,
      expenses: [
        { id: "e1", name: "Housing", amount: 1500 },
        { id: "e2", name: "Food", amount: 600 },
        { id: "e3", name: "Transportation", amount: 400 },
        { id: "e4", name: "Utilities", amount: 300 },
        { id: "e5", name: "Insurance", amount: 200 },
        { id: "e6", name: "Entertainment", amount: 250 },
        { id: "e7", name: "Savings", amount: 750 },
        { id: "e8", name: "Debt Repayment", amount: 500 },
        { id: "e9", name: "Miscellaneous", amount: 350 },
      ],
    },
    {
      id: "2",
      name: "Debt Payoff Focus",
      description: "Prioritize debt repayment by reducing discretionary spending",
      isBaseline: false,
      income: 5000,
      expenses: [
        { id: "e1", name: "Housing", amount: 1500 },
        { id: "e2", name: "Food", amount: 500 },
        { id: "e3", name: "Transportation", amount: 350 },
        { id: "e4", name: "Utilities", amount: 300 },
        { id: "e5", name: "Insurance", amount: 200 },
        { id: "e6", name: "Entertainment", amount: 150 },
        { id: "e7", name: "Savings", amount: 500 },
        { id: "e8", name: "Debt Repayment", amount: 1200 },
        { id: "e9", name: "Miscellaneous", amount: 300 },
      ],
    },
  ])

  const [activeScenarioId, setActiveScenarioId] = useState("1")
  const [activeTab, setActiveTab] = useState("edit")

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Calculate total expenses
  const getTotalExpenses = (expenses: { id: string; name: string; amount: number }[]) => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  // Calculate remaining money
  const getRemaining = (income: number, expenses: { id: string; name: string; amount: number }[]) => {
    return income - getTotalExpenses(expenses)
  }

  // Prepare data for waterfall chart
  const getWaterfallData = (scenario: typeof activeScenario) => {
    const data = [
      { name: "Income", value: scenario.income, isIncome: true },
      ...scenario.expenses.map((expense) => ({
        name: expense.name,
        value: -expense.amount,
      })),
      {
        name: "Remaining",
        value: getRemaining(scenario.income, scenario.expenses),
        isTotal: true,
      },
    ]

    return data
  }

  // Add a new scenario
  const addScenario = () => {
    const newId = (Math.max(...scenarios.map((s) => Number.parseInt(s.id))) + 1).toString()
    const newScenario = {
      id: newId,
      name: `New Scenario ${newId}`,
      description: "Description of your new budget scenario",
      isBaseline: false,
      income: 5000,
      expenses: [
        { id: "e1", name: "Housing", amount: 1500 },
        { id: "e2", name: "Food", amount: 600 },
        { id: "e3", name: "Transportation", amount: 400 },
        { id: "e4", name: "Utilities", amount: 300 },
        { id: "e5", name: "Insurance", amount: 200 },
        { id: "e6", name: "Entertainment", amount: 250 },
        { id: "e7", name: "Savings", amount: 750 },
        { id: "e8", name: "Debt Repayment", amount: 500 },
        { id: "e9", name: "Miscellaneous", amount: 350 },
      ],
    }

    setScenarios([...scenarios, newScenario])
    setActiveScenarioId(newId)
    setActiveTab("edit")
  }

  // Duplicate a scenario
  const duplicateScenario = (scenarioId: string) => {
    const scenarioToDuplicate = scenarios.find((s) => s.id === scenarioId)
    if (!scenarioToDuplicate) return

    const newId = (Math.max(...scenarios.map((s) => Number.parseInt(s.id))) + 1).toString()
    const newScenario = {
      ...scenarioToDuplicate,
      id: newId,
      name: `${scenarioToDuplicate.name} (Copy)`,
      isBaseline: false,
    }

    setScenarios([...scenarios, newScenario])
    setActiveScenarioId(newId)
    setActiveTab("edit")
  }

  // Delete a scenario
  const deleteScenario = (scenarioId: string) => {
    if (scenarios.length <= 1) return

    const updatedScenarios = scenarios.filter((s) => s.id !== scenarioId)
    setScenarios(updatedScenarios)

    if (activeScenarioId === scenarioId) {
      setActiveScenarioId(updatedScenarios[0].id)
    }
  }

  // Update scenario name
  const updateScenarioName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedScenarios = scenarios.map((s) => (s.id === activeScenarioId ? { ...s, name: e.target.value } : s))
    setScenarios(updatedScenarios)
  }

  // Update scenario description
  const updateScenarioDescription = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedScenarios = scenarios.map((s) =>
      s.id === activeScenarioId ? { ...s, description: e.target.value } : s,
    )
    setScenarios(updatedScenarios)
  }

  // Update scenario income
  const updateScenarioIncome = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value.replace(/[^0-9.]/g, ""))
    const income = isNaN(value) ? 0 : value

    const updatedScenarios = scenarios.map((s) => (s.id === activeScenarioId ? { ...s, income } : s))
    setScenarios(updatedScenarios)
  }

  // Update expense amount
  const updateExpenseAmount = (expenseId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value.replace(/[^0-9.]/g, ""))
    const amount = isNaN(value) ? 0 : value

    const updatedScenarios = scenarios.map((s) => {
      if (s.id === activeScenarioId) {
        const updatedExpenses = s.expenses.map((exp) => (exp.id === expenseId ? { ...exp, amount } : exp))
        return { ...s, expenses: updatedExpenses }
      }
      return s
    })

    setScenarios(updatedScenarios)
  }

  // Apply scenario as the new budget
  const applyScenario = () => {
    // In a real app, this would save the scenario as the active budget
    alert(`Scenario "${activeScenario.name}" has been applied as your new budget!`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Scenario Planning</h1>
          <p className="text-muted-foreground mt-2">
            Test different budgeting strategies and see their impact on your finances
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/budgeting">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Budgeting
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Scenarios</CardTitle>
              <CardDescription>Create and compare different budget scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                    activeScenarioId === scenario.id ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveScenarioId(scenario.id)}
                >
                  <div>
                    <p className="font-medium">{scenario.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {scenario.isBaseline
                        ? "Baseline"
                        : `${formatCurrency(getRemaining(scenario.income, scenario.expenses))} remaining`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateScenario(scenario.id)
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!scenario.isBaseline && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteScenario(scenario.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full mt-2" onClick={addScenario}>
                <Plus className="mr-2 h-4 w-4" />
                New Scenario
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={applyScenario} disabled={activeScenario.isBaseline}>
                <Play className="mr-2 h-4 w-4" />
                Apply This Scenario
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{activeScenario.name}</CardTitle>
              <CardDescription>{activeScenario.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(activeScenario.income)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(getTotalExpenses(activeScenario.expenses))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p
                    className={`text-2xl font-bold ${
                      getRemaining(activeScenario.income, activeScenario.expenses) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(getRemaining(activeScenario.income, activeScenario.expenses))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="edit">Edit Scenario</TabsTrigger>
              <TabsTrigger value="visualize">Visualize Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Details</CardTitle>
                  <CardDescription>Edit the details of your budget scenario</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="scenario-name">Scenario Name</Label>
                      <Input
                        id="scenario-name"
                        value={activeScenario.name}
                        onChange={updateScenarioName}
                        disabled={activeScenario.isBaseline}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scenario-description">Description</Label>
                      <Input
                        id="scenario-description"
                        value={activeScenario.description}
                        onChange={updateScenarioDescription}
                        disabled={activeScenario.isBaseline}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly-income">Monthly Income</Label>
                    <Input
                      id="monthly-income"
                      value={formatCurrency(activeScenario.income)}
                      onChange={updateScenarioIncome}
                      disabled={activeScenario.isBaseline}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Allocation</CardTitle>
                  <CardDescription>Adjust how your income is allocated across different categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeScenario.expenses.map((expense) => (
                      <div key={expense.id} className="grid gap-4 sm:grid-cols-3 items-center">
                        <Label htmlFor={`expense-${expense.id}`} className="sm:text-right">
                          {expense.name}
                        </Label>
                        <div className="sm:col-span-2">
                          <Input
                            id={`expense-${expense.id}`}
                            value={formatCurrency(expense.amount)}
                            onChange={(e) => updateExpenseAmount(expense.id, e)}
                            disabled={activeScenario.isBaseline}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visualize" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Waterfall</CardTitle>
                  <CardDescription>
                    Visualize how your income flows through different expense categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <BudgetWaterfallChart data={getWaterfallData(activeScenario)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Impact</CardTitle>
                  <CardDescription>How this scenario affects your financial goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                      <p className="font-medium">Savings Rate</p>
                      <p className="text-2xl">
                        {(
                          ((activeScenario.expenses.find((e) => e.name === "Savings")?.amount || 0) /
                            activeScenario.income) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {((activeScenario.expenses.find((e) => e.name === "Savings")?.amount || 0) /
                          activeScenario.income) *
                          100 >=
                        20
                          ? "Excellent"
                          : "Needs improvement"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium">Debt Repayment</p>
                      <p className="text-2xl">
                        {(
                          ((activeScenario.expenses.find((e) => e.name === "Debt Repayment")?.amount || 0) /
                            activeScenario.income) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {((activeScenario.expenses.find((e) => e.name === "Debt Repayment")?.amount || 0) /
                          activeScenario.income) *
                          100 >=
                        15
                          ? "Aggressive payoff"
                          : "Standard pace"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium">Discretionary Spending</p>
                      <p className="text-2xl">
                        {(
                          (((activeScenario.expenses.find((e) => e.name === "Entertainment")?.amount || 0) +
                            (activeScenario.expenses.find((e) => e.name === "Miscellaneous")?.amount || 0)) /
                            activeScenario.income) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(((activeScenario.expenses.find((e) => e.name === "Entertainment")?.amount || 0) +
                          (activeScenario.expenses.find((e) => e.name === "Miscellaneous")?.amount || 0)) /
                          activeScenario.income) *
                          100 <=
                        15
                          ? "Well controlled"
                          : "Consider reducing"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

