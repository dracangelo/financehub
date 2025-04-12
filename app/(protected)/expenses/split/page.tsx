"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Users, Receipt, Check } from "lucide-react"
import Link from "next/link"
import { SplitExpenseList } from "@/components/expenses/split-expense-list"
import { SplitExpenseDetail } from "@/components/expenses/split-expense-detail"

export default function SplitTransactionsPage() {
  const [activeTab, setActiveTab] = useState<string>("active")
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)

  // Sample split expenses data
  const splitExpenses = [
    {
      id: "1",
      merchant: "Fancy Restaurant",
      category: "Dining",
      amount: 120.0,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "active" as const,
      participants: [
        {
          id: "user1",
          name: "You",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 60.0,
          status: "paid" as const,
        },
        {
          id: "user2",
          name: "Alex Smith",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 60.0,
          status: "pending" as const,
        },
      ],
    },
    {
      id: "2",
      merchant: "Airbnb",
      category: "Travel",
      amount: 450.0,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: "active" as const,
      participants: [
        {
          id: "user1",
          name: "You",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 150.0,
          status: "paid" as const,
        },
        {
          id: "user2",
          name: "Alex Smith",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 150.0,
          status: "pending" as const,
        },
        {
          id: "user3",
          name: "Jamie Doe",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 150.0,
          status: "pending" as const,
        },
      ],
    },
    {
      id: "3",
      merchant: "Grocery Store",
      category: "Groceries",
      amount: 85.75,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: "active" as const,
      participants: [
        {
          id: "user1",
          name: "You",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 42.88,
          status: "paid" as const,
        },
        {
          id: "user4",
          name: "Taylor Johnson",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 42.87,
          status: "pending" as const,
        },
      ],
    },
    {
      id: "4",
      merchant: "Movie Theater",
      category: "Entertainment",
      amount: 48.0,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      status: "settled" as const,
      participants: [
        {
          id: "user1",
          name: "You",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 24.0,
          status: "paid" as const,
        },
        {
          id: "user2",
          name: "Alex Smith",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 24.0,
          status: "paid" as const,
        },
      ],
    },
    {
      id: "5",
      merchant: "Uber",
      category: "Transportation",
      amount: 32.5,
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      status: "settled" as const,
      participants: [
        {
          id: "user1",
          name: "You",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 16.25,
          status: "paid" as const,
        },
        {
          id: "user3",
          name: "Jamie Doe",
          avatar: "/placeholder.svg?height=32&width=32",
          amount: 16.25,
          status: "paid" as const,
        },
      ],
    },
  ]

  // Filter expenses based on active tab
  const getFilteredExpenses = () => {
    return splitExpenses.filter((expense) => {
      if (activeTab === "active") {
        return expense.status === "active"
      } else if (activeTab === "settled") {
        return expense.status === "settled"
      }
      return true
    })
  }

  const filteredExpenses = getFilteredExpenses()
  const selectedExpense = splitExpenses.find((expense) => expense.id === selectedExpenseId)

  const handleExpenseSelect = (expenseId: string) => {
    setSelectedExpenseId(expenseId)
  }

  const handleCreateSplitExpense = () => {
    // In a real app, this would open a form to create a new split expense
    alert("This would open a form to create a new split expense")
  }

  // Calculate total owed to you
  const totalOwedToYou = splitExpenses
    .filter((expense) => expense.status === "active")
    .reduce((total, expense) => {
      const yourParticipation = expense.participants.find((p) => p.id === "user1")
      if (!yourParticipation) return total

      const othersOwingYou = expense.participants
        .filter((p) => p.id !== "user1" && p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0)

      return total + othersOwingYou
    }, 0)

  // Calculate total you owe
  const totalYouOwe = 0 // In this example, you've paid for everything

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Split Transactions</h1>
          <p className="text-muted-foreground mt-2">Easily split and track shared expenses with others</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/expenses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Expenses
            </Link>
          </Button>
          <Button onClick={handleCreateSplitExpense}>
            <Plus className="mr-2 h-4 w-4" />
            Split Expense
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Split Summary</CardTitle>
            <CardDescription>Overview of your shared expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Others Owe You</p>
                    <p className="text-3xl font-bold text-green-600">${totalOwedToYou.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      From {splitExpenses.filter((e) => e.status === "active").length} active expenses
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">You Owe Others</p>
                    <p className="text-3xl font-bold text-red-600">${totalYouOwe.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">All expenses paid</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-4">People You Split With</h3>
              <div className="flex flex-wrap gap-4">
                {Array.from(
                  new Set(
                    splitExpenses
                      .flatMap((e) => e.participants)
                      .filter((p) => p.id !== "user1")
                      .map((p) => p.id),
                  ),
                ).map((id) => {
                  const participant = splitExpenses.flatMap((e) => e.participants).find((p) => p.id === id)
                  if (!participant) return null

                  const owedAmount = splitExpenses
                    .filter((e) => e.status === "active")
                    .reduce((total, expense) => {
                      const participantInExpense = expense.participants.find((p) => p.id === id)
                      if (participantInExpense && participantInExpense.status === "pending") {
                        return total + participantInExpense.amount
                      }
                      return total
                    }, 0)

                  return (
                    <div key={id} className="flex items-center gap-2 p-2 border rounded-md">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.avatar} alt={participant.name} />
                        <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        {owedAmount > 0 ? (
                          <p className="text-xs text-green-600">Owes you ${owedAmount.toFixed(2)}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">All settled up</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on your shared expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {splitExpenses
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 3)
                .map((expense) => {
                  const pendingParticipants = expense.participants.filter((p) => p.status === "pending")

                  return (
                    <div key={expense.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{expense.merchant}</p>
                        <p className="text-xs text-muted-foreground">{expense.date.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${expense.amount.toFixed(2)}</p>
                        {pendingParticipants.length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {pendingParticipants.length} pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                            Settled
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Active Splits
          </TabsTrigger>
          <TabsTrigger value="settled" className="flex items-center">
            <Check className="mr-2 h-4 w-4" />
            Settled
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg flex items-center">
                    <Receipt className="mr-2 h-4 w-4" />
                    Split Expenses
                  </CardTitle>
                  <CardDescription>
                    {filteredExpenses.length} {filteredExpenses.length === 1 ? "expense" : "expenses"} found
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <SplitExpenseList
                    expenses={filteredExpenses}
                    onSelectExpense={handleExpenseSelect}
                    selectedExpenseId={selectedExpenseId}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              {selectedExpense ? (
                <SplitExpenseDetail expense={selectedExpense} />
              ) : (
                <Card className="h-full">
                  <CardContent className="flex flex-col items-center justify-center h-full py-20 text-center">
                    <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Select a Split Expense</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">
                      Select a split expense from the list to view details, or create a new split expense to get
                      started.
                    </p>
                    <Button className="mt-4" onClick={handleCreateSplitExpense}>
                      <Plus className="mr-2 h-4 w-4" />
                      Split Expense
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settled" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg flex items-center">
                    <Check className="mr-2 h-4 w-4" />
                    Settled Expenses
                  </CardTitle>
                  <CardDescription>
                    {filteredExpenses.length} {filteredExpenses.length === 1 ? "expense" : "expenses"} found
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <SplitExpenseList
                    expenses={filteredExpenses}
                    onSelectExpense={handleExpenseSelect}
                    selectedExpenseId={selectedExpenseId}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              {selectedExpense ? (
                <SplitExpenseDetail expense={selectedExpense} />
              ) : (
                <Card className="h-full">
                  <CardContent className="flex flex-col items-center justify-center h-full py-20 text-center">
                    <Check className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Select a Settled Expense</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">
                      Select a settled expense from the list to view details.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

