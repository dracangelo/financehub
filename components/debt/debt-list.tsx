"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Plus, CreditCard, Home, Car, GraduationCap, Edit, Trash2 } from "lucide-react"
import { DebtDialog } from "@/components/debt/debt-dialog"

type DebtType = "credit-card" | "mortgage" | "auto" | "student" | "personal" | "medical" | "other"

interface Debt {
  id: string
  name: string
  type: DebtType
  balance: number
  interestRate: number
  minimumPayment: number
  actualPayment: number
  dueDate: number // Day of month
}

export function DebtList() {
  const [open, setOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)

  // This would come from your database in a real app
  const debts: Debt[] = [
    {
      id: "1",
      name: "Credit Card A",
      type: "credit-card",
      balance: 5750,
      interestRate: 24.99,
      minimumPayment: 150,
      actualPayment: 300,
      dueDate: 15,
    },
    {
      id: "2",
      name: "Auto Loan",
      type: "auto",
      balance: 18500,
      interestRate: 4.5,
      minimumPayment: 450,
      actualPayment: 450,
      dueDate: 5,
    },
    {
      id: "3",
      name: "Student Loan",
      type: "student",
      balance: 21500,
      interestRate: 5.8,
      minimumPayment: 250,
      actualPayment: 500,
      dueDate: 21,
    },
  ]

  const debtTypeIcons: Record<DebtType, React.ReactNode> = {
    "credit-card": <CreditCard className="h-4 w-4" />,
    mortgage: <Home className="h-4 w-4" />,
    auto: <Car className="h-4 w-4" />,
    student: <GraduationCap className="h-4 w-4" />,
    personal: <CreditCard className="h-4 w-4" />,
    medical: <CreditCard className="h-4 w-4" />,
    other: <CreditCard className="h-4 w-4" />,
  }

  const handleAddDebt = () => {
    setSelectedDebt(null)
    setOpen(true)
  }

  const handleEditDebt = (debt: Debt) => {
    setSelectedDebt(debt)
    setOpen(true)
  }

  const handleDeleteDebt = (id: string) => {
    // In a real app, this would delete the debt from your database
    console.log(`Delete debt with ID: ${id}`)
  }

  const handleSaveDebt = (debt: Debt) => {
    // In a real app, this would save the debt to your database
    console.log("Save debt:", debt)
    setOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Debts</CardTitle>
              <CardDescription>Manage and track all your debts in one place</CardDescription>
            </div>
            <Button onClick={handleAddDebt}>
              <Plus className="mr-2 h-4 w-4" />
              Add Debt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Min. Payment</TableHead>
                <TableHead>Actual Payment</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="mr-2 rounded-full bg-muted p-1">{debtTypeIcons[debt.type]}</div>
                      <div>
                        <div className="font-medium">{debt.name}</div>
                        <Badge variant="outline" className="mt-1">
                          {debt.type.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(debt.balance)}</TableCell>
                  <TableCell>{debt.interestRate}%</TableCell>
                  <TableCell>{formatCurrency(debt.minimumPayment)}</TableCell>
                  <TableCell>{formatCurrency(debt.actualPayment)}</TableCell>
                  <TableCell>{debt.dueDate}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditDebt(debt)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDebt(debt.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3">
          <div className="flex w-full items-center justify-between">
            <div className="text-sm text-muted-foreground">Total Debts: {debts.length}</div>
            <div className="font-medium">
              Total Balance: {formatCurrency(debts.reduce((sum, debt) => sum + debt.balance, 0))}
            </div>
          </div>
        </CardFooter>
      </Card>

      <DebtDialog open={open} onOpenChange={setOpen} debt={selectedDebt} onSave={handleSaveDebt} />
    </>
  )
}

