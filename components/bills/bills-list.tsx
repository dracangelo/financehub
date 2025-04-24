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
  payment_schedule?: { status: string; scheduled_date: string }[]
  billers?: { name: string; category: string }
  is_paid?: boolean
  status?: string
  scheduled_date?: string
}

interface BillsListProps {
  showCalendarView?: boolean;
}

export function BillsList({ showCalendarView = false }: BillsListProps) {
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [filteredBills, setFilteredBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [billToDelete, setBillToDelete] = useState<string | null>(null)
  const [openPayDialog, setOpenPayDialog] = useState(false)
  const [billToPay, setBillToPay] = useState<Bill | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<'name' | 'amount' | 'next_payment_date'>('next_payment_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch bills on component mount
  useEffect(() => {
    fetchBills()
  }, [])

  // Apply filters and sorting whenever bills, search query, or filters change
  useEffect(() => {
    applyFiltersAndSort()
  }, [bills, searchQuery, sortField, sortDirection, statusFilter])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const data = await getBills()
      
      // Validate and sanitize the data
      const validatedBills = data.map((bill: any) => ({
        ...bill,
        amount: typeof bill.amount === 'number' ? bill.amount : parseFloat(bill.amount) || 0,
        next_payment_date: bill.next_payment_date || new Date().toISOString().split('T')[0]
      }))
      
      setBills(validatedBills)
    } catch (err) {
      console.error("Error fetching bills:", err)
      setError(typeof err === 'string' ? err : "Failed to load bills. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  const refreshBills = async () => {
    setIsRefreshing(true)
    await fetchBills()
    setIsRefreshing(false)
  }

  // Apply filters and sorting to bills
  const applyFiltersAndSort = () => {
    let result = [...bills]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(bill => 
        bill.name.toLowerCase().includes(query) || 
        (bill.billers?.name && bill.billers.name.toLowerCase().includes(query))
      )
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(bill => getBillStatus(bill) === statusFilter)
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'next_payment_date':
          // Handle invalid dates by treating them as latest
          const dateA = new Date(a.next_payment_date)
          const dateB = new Date(b.next_payment_date)
          const validDateA = !isNaN(dateA.getTime())
          const validDateB = !isNaN(dateB.getTime())
          
          if (!validDateA && !validDateB) comparison = 0
          else if (!validDateA) comparison = 1
          else if (!validDateB) comparison = -1
          else comparison = dateA.getTime() - dateB.getTime()
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    setFilteredBills(result)
  }

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
      setError(typeof err === 'string' ? err : "Failed to delete bill. Please try again.")
      setOpenDeleteDialog(false)
    }
  }

  const handlePayBill = (bill: Bill) => {
    setBillToPay(bill)
    setOpenPayDialog(true)
  }

  const confirmPayBill = async () => {
    if (!billToPay) return

    try {
      // Create a proper FormData object with any necessary fields
      const formData = new FormData()
      formData.append('payment_method', 'manual')
      
      await markBillAsPaid(billToPay.id, formData)
      await refreshBills()
      setOpenPayDialog(false)
      setBillToPay(null)
    } catch (err) {
      console.error("Error marking bill as paid:", err)
      setError(typeof err === 'string' ? err : "Failed to mark bill as paid. Please try again.")
    }
  }

  const handleSaveBill = async () => {
    await refreshBills()
    setOpenDialog(false)
  }
  
  const handleSortChange = (field: 'name' | 'amount' | 'next_payment_date') => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortDirection('asc')
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
    
    // Check if there are any bill payments
    if (bill.bill_payments && bill.bill_payments.length > 0) {
      // Sort payments by date, most recent first
      const sortedPayments = [...bill.bill_payments].sort((a, b) => 
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      );
      
      // If the most recent payment has a completed status, the bill is paid
      if (sortedPayments[0].payment_status === "completed") {
        return "paid";
      }
    }
    
    // If status not determined yet, check due date
    try {
      const dueDate = new Date(bill.next_payment_date);
      const today = new Date();
      
      // Set hours to 0 for proper comparison
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      if (isNaN(dueDate.getTime())) {
        return "unpaid"; // Default to unpaid if date is invalid
      }
      
      // Calculate the difference in days
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If due date has passed, it's overdue
      if (diffDays < 0) {
        // If auto_pay is enabled, mark as paid
        if (bill.auto_pay) {
          return "paid";
        }
        return "overdue";
      }
      
      // If due date is within 7 days, it's upcoming
      if (diffDays <= 7) {
        return "upcoming";
      }
      
      // More than 7 days away
      return "unpaid";
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
      );
    }
    
    if (status === "overdue") {
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          Overdue
        </Badge>
      );
    }
    
    if (status === "upcoming") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="mr-1 h-3 w-3" />
          Due Soon
        </Badge>
      );
    }
    
    // Default unpaid
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="mr-1 h-3 w-3" />
        Unpaid
      </Badge>
    );
  };

  if (showCalendarView) {
    return <BillsCalendar initialBills={bills} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bills</h2>
          <p className="text-muted-foreground">
            Manage your bills and payments.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!showCalendarView && (
            <Button variant="outline" onClick={() => router.push("/bills/calendar")}>
              <Calendar className="mr-2 h-4 w-4" />
              Calendar View
            </Button>
          )}
          <Button onClick={handleAddBill}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bill
          </Button>
        </div>
      </div>
      
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search bills..."
            className="w-full px-4 py-2 border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border rounded-md bg-background"
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshBills}
            disabled={isRefreshing}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${isRefreshing ? 'animate-spin' : ''}`}
            >
              <path d="M21 12a9 9 0 0 1-9 9" />
              <path d="M3 12a9 9 0 0 1 9-9" />
              <path d="M21 12a9 9 0 0 0-9 9" />
              <path d="M3 12a9 9 0 0 0 9-9" />
            </svg>
          </Button>
        </div>
      </div>

      {showCalendarView ? (
        <BillsCalendar initialBills={filteredBills} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSortChange('name')} className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center">
                      Bill
                      {sortField === 'name' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSortChange('amount')} className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center">
                      Amount
                      {sortField === 'amount' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSortChange('next_payment_date')} className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center">
                      Due Date
                      {sortField === 'next_payment_date' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading state
                  Array(3).fill(0).map((_, i) => (
                    <TableRow key={`loading-${i}`}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredBills.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <p className="mb-2 text-muted-foreground">
                          {searchQuery || statusFilter 
                            ? "No bills match your search criteria" 
                            : "No bills found. Add your first bill to get started."}
                        </p>
                        {!searchQuery && !statusFilter && (
                          <Button onClick={handleAddBill} variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Bill
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Bills list
                  filteredBills.map((bill) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          {!loading && filteredBills.length > 0 && (
            <div className="p-4 border-t text-sm text-muted-foreground">
              Showing {filteredBills.length} of {bills.length} bills
              {(searchQuery || statusFilter) && " (filtered)"}
            </div>
          )}
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
