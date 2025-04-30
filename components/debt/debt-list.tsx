"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Plus, CreditCard, Home, Car, GraduationCap, Edit, Trash2, Briefcase, Stethoscope } from "lucide-react"
import { DebtDialog } from "@/components/debt/debt-dialog"
import { Debt } from "@/types/debt"
import { DebtService } from "@/lib/debt/debt-service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function DebtList() {
  const [open, setOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Fetch debts when component mounts
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    try {
      setLoading(true)
      const debtService = new DebtService()
      const fetchedDebts = await debtService.getDebts()
      setDebts(fetchedDebts)
    } catch (error) {
      console.error("Error fetching debts:", error)
      toast({
        title: "Error",
        description: "Failed to load debts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const debtTypeIcons: Record<string, React.ReactNode> = {
    "credit_card": <CreditCard className="h-4 w-4" />,
    "credit-card": <CreditCard className="h-4 w-4" />,
    "mortgage": <Home className="h-4 w-4" />,
    "auto": <Car className="h-4 w-4" />,
    "auto_loan": <Car className="h-4 w-4" />,
    "student": <GraduationCap className="h-4 w-4" />,
    "student_loan": <GraduationCap className="h-4 w-4" />,
    "personal": <Briefcase className="h-4 w-4" />,
    "personal_loan": <Briefcase className="h-4 w-4" />,
    "medical": <Stethoscope className="h-4 w-4" />,
    "other": <CreditCard className="h-4 w-4" />,
  }

  const formatDebtType = (type: string) => {
    return type.replace('_', ' ').replace('-', ' ')
  }

  const handleAddDebt = () => {
    setSelectedDebt(null)
    setOpen(true)
  }

  const handleEditDebt = (debt: Debt) => {
    setSelectedDebt(debt)
    setOpen(true)
  }

  const handleDeleteDebt = async (id: string) => {
    try {
      setDeleting(id)
      const debtService = new DebtService()
      await debtService.deleteDebt(id)
      
      // Remove the debt from the local state
      setDebts(debts.filter(debt => debt.id !== id))
      
      toast({
        title: "Success",
        description: "Debt deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting debt:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete debt",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleSaveDebt = async (debt: Debt) => {
    try {
      const debtService = new DebtService()
      
      if (selectedDebt) {
        // Update existing debt
        await debtService.updateDebt(debt.id, {
          name: debt.name,
          current_balance: debt.current_balance,
          interest_rate: debt.interest_rate,
          minimum_payment: debt.minimum_payment,
          loan_term: debt.loan_term
        })
      } else {
        // Create new debt
        await debtService.createDebt({
          name: debt.name,
          current_balance: debt.current_balance,
          interest_rate: debt.interest_rate,
          minimum_payment: debt.minimum_payment,
          loan_term: debt.loan_term,
          due_date: debt.due_date
        })
      }
      
      // Refresh the debts list
      fetchDebts()
      
      setOpen(false)
      toast({
        title: "Success",
        description: selectedDebt ? "Debt updated successfully" : "Debt added successfully",
      })
    } catch (error) {
      console.error("Error saving debt:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save debt",
        variant: "destructive",
      })
    }
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
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : debts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No debts added yet. Click "Add Debt" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Min. Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt) => (
                  <TableRow key={debt.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="mr-2 rounded-full bg-muted p-1">
                          {debtTypeIcons[debt.type] || <CreditCard className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{debt.name}</div>
                          <Badge variant="outline" className="mt-1">
                            {formatDebtType(debt.type)}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(debt.current_balance)}</TableCell>
                    <TableCell>{debt.interest_rate}%</TableCell>
                    <TableCell>{formatCurrency(debt.minimum_payment)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditDebt(debt)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteDebt(debt.id)}
                        disabled={deleting === debt.id}
                      >
                        {deleting === debt.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3">
          <div className="flex w-full items-center justify-between">
            <div className="text-sm text-muted-foreground">Total Debts: {debts.length}</div>
            <div className="font-medium">
              Total Balance: {formatCurrency(debts.reduce((sum, debt) => sum + debt.current_balance, 0))}
            </div>
          </div>
        </CardFooter>
      </Card>

      <DebtDialog open={open} onOpenChange={setOpen} debt={selectedDebt} onSave={handleSaveDebt} />
    </>
  )
}
