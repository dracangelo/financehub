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

interface Bill {
  id: string
  name: string
  amount: number
  due_date: string
  status: string
  is_recurring: boolean
  recurrence_pattern: string
  auto_pay: boolean
  category_id?: string
  payment_method_id?: string
  notes?: string
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

  useEffect(() => {
    if (bill) {
      setIsRecurring(bill.is_recurring)
      setIsAutoPay(bill.auto_pay)
    } else {
      setIsRecurring(false)
      setIsAutoPay(false)
    }
  }, [bill, open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      if (bill) {
        await updateBill(bill.id, formData)
      } else {
        await createBill(formData)
      }

      onSave()
    } catch (err) {
      console.error("Error saving bill:", err)
      setError("Failed to save bill. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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
              <Label htmlFor="due_date" className="text-right">
                Due Date
              </Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                defaultValue={bill?.due_date}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category_id" className="text-right">
                Category
              </Label>
              <Select name="category_id" defaultValue={bill?.category_id || ""}>
                <SelectTrigger id="category_id" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="debt">Debt</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment_method_id" className="text-right">
                Payment Method
              </Label>
              <Select name="payment_method_id" defaultValue={bill?.payment_method_id || ""}>
                <SelectTrigger id="payment_method_id" className="col-span-3">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_specified">Not specified</SelectItem>
                  <SelectItem value="bank_account">Bank Account</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
                <Select name="recurrence_pattern" defaultValue={bill?.recurrence_pattern || "monthly"}>
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

