"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BillDialog } from "@/components/bills/bill-dialog"
import { getBills, deleteBill, markBillAsPaid } from "@/app/actions/bills"
import { formatCurrency } from "@/lib/utils"
import { Calendar, Clock, Plus, Edit, Trash2, CheckCircle, AlertCircle } from "lucide-react"

interface Bill {
  id: string
  name: string
  amount: number
  due_date: string
  status: string
  is_recurring: boolean
  recurrence_pattern: string
  auto_pay: boolean
  categories?: { name: string; color: string }
  payment_methods?: { name: string; type: string }
}

export function BillsList() {
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [billToDelete, setBillToDelete] = useState<string | null>(null)
  const [openPayDialog, setOpenPayDialog] = useState(false)
  const [billToPay, setBillToPay] = useState<Bill | null>(null)

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const data = await getBills()
        setBills(data)
      } catch (err) {
        setError("Error fetching bills")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchBills()
  }, [])

  const handleAddBill = () => {
    setSelectedBill(null)
    setOpenDialog(true)
  }

  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill)
    setOpenDialog(true)
  }

  const handleDeleteBill = (id: string) => {
    setBillToDelete(id)
    setOpenDeleteDialog(true)
  }

  const confirmDeleteBill = async () => {
    if (!billToDelete) return

    try {
      await deleteBill(billToDelete)
      setBills(bills.filter((bill) => bill.id !== billToDelete))
      setOpenDeleteDialog(false)
      setBillToDelete(null)
    } catch (err) {
      console.error("Error deleting bill:", err)
    }
  }

  const handlePayBill = (bill: Bill) => {
    setBillToPay(bill)
    setOpenPayDialog(true)
  }

  const confirmPayBill = async () => {
    if (!billToPay) return

    try {
      await markBillAsPaid(billToPay.id, new FormData())
      // Refresh bills list
      const data = await getBills()
      setBills(data)
      setOpenPayDialog(false)
      setBillToPay(null)
    } catch (err) {
      console.error("Error marking bill as paid:", err)
    }
  }

  const handleSaveBill = async () => {
    // Refresh bills list
    try {
      const data = await getBills()
      setBills(data)
      setOpenDialog(false)
    } catch (err) {
      console.error("Error refreshing bills:", err)
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getBillStatusBadge = (bill: Bill) => {
    if (bill.status === "paid") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Paid
        </Badge>
      )
    }

    const daysUntilDue = getDaysUntilDue(bill.due_date)

    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Overdue</Badge>
    } else if (daysUntilDue <= 3) {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          Due Soon
        </Badge>
      )
    } else {
      return <Badge variant="outline">Upcoming</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">Bills</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Bill
          </Button>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">Bills</h2>
          <Button onClick={handleAddBill}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bill
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => setLoading(true)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold tracking-tight">Bills</h2>
        <Button onClick={handleAddBill}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="font-medium">No bills yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add your first bill to start tracking your payments.</p>
            <Button variant="outline" className="mt-4" onClick={handleAddBill}>
              <Plus className="mr-2 h-4 w-4" />
              Add Bill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills</CardTitle>
            <CardDescription>Track and manage your bill payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recurring</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <div className="font-medium">{bill.name}</div>
                      <div className="text-xs text-muted-foreground">{bill.categories?.name || "Uncategorized"}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(bill.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {new Date(bill.due_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{getBillStatusBadge(bill)}</TableCell>
                    <TableCell>
                      {bill.is_recurring ? (
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{bill.recurrence_pattern}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">One-time</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {bill.status !== "paid" && (
                        <Button variant="ghost" size="icon" onClick={() => handlePayBill(bill)} title="Mark as paid">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEditBill(bill)} title="Edit bill">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBill(bill.id)} title="Delete bill">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <BillDialog open={openDialog} onOpenChange={setOpenDialog} bill={selectedBill} onSave={handleSaveBill} />

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this bill and remove it from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBill} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openPayDialog} onOpenChange={setOpenPayDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark bill as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the bill as paid and update your payment records.
              {billToPay?.is_recurring && " A new recurring bill will be created for the next cycle."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPayBill}>Mark as Paid</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

