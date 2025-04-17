"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { createBill, updateBill } from "@/app/actions/bills"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

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
  notes?: string
  type?: string
}

interface BillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: Bill | null
  onSave: () => void
}

export function BillDialog({ open, onOpenChange, bill, onSave }: BillDialogProps) {
  const [isRecurring, setIsRecurring] = useState(false)
  const [isAutoPay, setIsAutoPay] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState<string>("unpaid")

  useEffect(() => {
    if (bill) {
      setIsRecurring(bill.is_recurring)
      setIsAutoPay(bill.auto_pay)
      
      // Determine status from payment_schedule if available
      if (bill.payment_schedule && bill.payment_schedule.length > 0) {
        const latestSchedule = bill.payment_schedule[0];
        setStatus(latestSchedule.status || "unpaid");
      } else {
        // If no payment_schedule, determine status based on due date
        try {
          const dueDate = new Date(bill.next_payment_date);
          const today = new Date();
          
          if (isNaN(dueDate.getTime())) {
            setStatus("unpaid");
          } else if (dueDate < today) {
            setStatus("overdue");
          } else {
            setStatus("unpaid");
          }
        } catch (e) {
          setStatus("unpaid");
        }
      }
      
      // Format the date properly if it exists
      if (bill.next_payment_date) {
        try {
          const date = new Date(bill.next_payment_date)
          if (!isNaN(date.getTime())) {
            setDueDate(date)
          } else {
            setDueDate(undefined)
          }
        } catch (e) {
          setDueDate(undefined)
        }
      } else {
        setDueDate(undefined)
      }
    } else {
      setIsRecurring(false)
      setIsAutoPay(false)
      setDueDate(undefined)
      setStatus("unpaid")
    }
  }, [bill, open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      // Add the date in the correct format
      if (!dueDate) {
        throw new Error("Due date is required")
      }
      
      // Format date as YYYY-MM-DD
      const formattedDate = format(dueDate, "yyyy-MM-dd")
      formData.set("next_payment_date", formattedDate)
      
      // Add recurring and billing frequency
      formData.set("is_recurring", isRecurring ? "true" : "false")
      
      // If it's a recurring bill, ensure we have a recurrence pattern
      if (isRecurring) {
        const recurrencePattern = formData.get("recurrence_pattern") as string || "monthly"
        formData.set("billing_frequency", recurrencePattern)
      } else {
        // Use 'monthly' as default for non-recurring bills to match database constraints
        formData.set("billing_frequency", "monthly")
      }
      
      // Add auto-pay
      formData.set("auto_pay", isAutoPay ? "true" : "false")

      if (bill) {
        await updateBill(bill.id, formData)
      } else {
        await createBill(formData)
      }

      onSave()
    } catch (err) {
      console.error("Error saving bill:", err)
      setError(err instanceof Error ? err.message : "Failed to save bill. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Status option renderer with icons and colors
  const statusOptions = [
    { value: "paid", label: "Paid", icon: CheckCircle2, color: "text-green-500" },
    { value: "unpaid", label: "Unpaid", icon: Clock, color: "text-gray-500" },
    { value: "overdue", label: "Overdue", icon: AlertCircle, color: "text-red-500" }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{bill ? "Edit Bill" : "Add New Bill"}</DialogTitle>
            <DialogDescription>
              {bill ? "Update your bill details" : "Enter the details of your bill"}
            </DialogDescription>
          </DialogHeader>

          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">{error}</div>}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" defaultValue={bill?.name} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={bill?.amount}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="next_payment_date" className="text-right">
                Next Payment Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => setDueDate(date || undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Recurring</Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="is_recurring"
                  name="is_recurring"
                  value="true"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
                <Label htmlFor="is_recurring">This is a recurring bill</Label>
              </div>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recurrence_pattern" className="text-right">
                  Frequency
                </Label>
                <Select name="recurrence_pattern" defaultValue={bill?.billing_frequency || "monthly"}>
                  <SelectTrigger id="recurrence_pattern" className="col-span-3">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semiannually">Semi-annually</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Auto-pay</Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch id="auto_pay" name="auto_pay" value="true" checked={isAutoPay} onCheckedChange={setIsAutoPay} />
                <Label htmlFor="auto_pay">This bill is paid automatically</Label>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea id="notes" name="notes" defaultValue={bill?.notes} className="col-span-3" rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : bill ? "Update Bill" : "Add Bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
