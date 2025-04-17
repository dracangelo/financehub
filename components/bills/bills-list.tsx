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
import { format, isValid, parseISO } from "date-fns"
import { BillsCalendar } from "./bills-calendar"

interface Bill {
  id: string
  name: string
  amount: number
  next_payment_date: string
  is_recurring: boolean
  billing_frequency: string
  auto_pay: boolean
  payment_schedule?: { status: string; scheduled_date: string }[]
  billers?: { name: string; category: string }
  is_paid?: boolean
}

interface BillsListProps {
  showCalendarView?: boolean;
}

export function BillsList({ showCalendarView = false }: BillsListProps) {
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
        console.log("Fetched bills:", data)
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

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "N/A";
      
      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      
      // Format the date
      return format(date, "MMM d, yyyy");
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  const getBillStatus = (bill: Bill) => {
    // First check if the bill has been explicitly marked as paid
    if (bill.is_paid) {
      return "paid";
    }
    
    // Then check payment_schedule if available
    if (bill.payment_schedule && bill.payment_schedule.length > 0) {
      const latestSchedule = bill.payment_schedule[0];
      if (latestSchedule.status === "paid") {
        return "paid";
      }
      if (latestSchedule.status === "overdue") {
        return "overdue";
      }
    }
    
    // If no payment_schedule or status not determined, check due date
    try {
      const dueDate = new Date(bill.next_payment_date);
      const today = new Date();
      
      // Set hours to 0 for proper comparison
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      if (isNaN(dueDate.getTime())) {
        return "unpaid"; // Default to unpaid if date is invalid
      }
      
      if (dueDate < today) {
        return "overdue";
      }
    } catch (e) {
      console.error("Error determining bill status:", e);
    }
    
    return "unpaid";
  };

  const getBillStatusBadge = (bill: Bill) => {
    const status = getBillStatus(bill);
    
    if (status === "paid") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Paid
        </Badge>
      )
    }
    
    if (status === "overdue") {
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          Overdue
        </Badge>
      )
    }
    
    // Default unpaid
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="mr-1 h-3 w-3" />
        Unpaid
      </Badge>
    )
  }

  if (showCalendarView) {
    return <BillsCalendar bills={bills} loading={loading} error={error} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Bills</h2>
        <Button onClick={handleAddBill}>
          <Plus className="mr-2 h-4 w-4" /> Add Bill
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-[400px] w-full" />
      ) : error ? (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">No bills found</h3>
              <p className="text-muted-foreground">Add your first bill to get started</p>
              <Button onClick={handleAddBill} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Bill
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills</CardTitle>
            <CardDescription>Manage your recurring and one-time bills</CardDescription>
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
                      <div className="text-xs text-muted-foreground">
                        {bill.billers?.name || "Uncategorized"}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(bill.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(bill.next_payment_date)}
                      </div>
                    </TableCell>
                    <TableCell>{getBillStatusBadge(bill)}</TableCell>
                    <TableCell>
                      {bill.is_recurring ? (
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{bill.billing_frequency}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">One-time</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {getBillStatus(bill) !== "paid" && (
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
