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
import type { Debt } from "@/app/actions/debts"  // Import the Debt type from server actions

interface DebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt | null
  onSave: (debt: Debt) => void
}

export function DebtDialog({ open, onOpenChange, debt, onSave }: DebtDialogProps) {
  const [formData, setFormData] = useState<Debt>({
    id: crypto.randomUUID(),
    name: "",
    type: "credit_card",
    principal: 0,
    interest_rate: 0,
    minimum_payment: 0,
    due_date: "",
  })

  useEffect(() => {
    if (debt) {
      // Set the form data directly from the debt object
      setFormData({
        ...debt
      })
    } else {
      // Create a new debt with default values
      setFormData({
        id: crypto.randomUUID(),
        name: "",
        type: "credit_card",
        principal: 0,
        interest_rate: 0,
        minimum_payment: 0,
        due_date: "",
      })
    }
  }, [debt, open])

  const handleChange = (field: keyof Debt, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{debt ? "Edit Debt" : "Add New Debt"}</DialogTitle>
            <DialogDescription>
              {debt
                ? "Update the details of your existing debt."
                : "Enter the details of your debt to add it to your tracker."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger id="type" className="col-span-3">
                  <SelectValue placeholder="Select debt type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="auto_loan">Auto Loan</SelectItem>
                  <SelectItem value="student_loan">Student Loan</SelectItem>
                  <SelectItem value="personal_loan">Personal Loan</SelectItem>
                  <SelectItem value="medical">Medical Debt</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="principal" className="text-right">
                Balance ($)
              </Label>
              <Input
                id="principal"
                type="number"
                min="0"
                step="0.01"
                value={formData.principal}
                onChange={(e) => handleChange("principal", Number.parseFloat(e.target.value) || 0)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interest_rate" className="text-right">
                Interest Rate (%)
              </Label>
              <Input
                id="interest_rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.interest_rate}
                onChange={(e) => handleChange("interest_rate", Number.parseFloat(e.target.value) || 0)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minimum_payment" className="text-right">
                Min. Payment ($)
              </Label>
              <Input
                id="minimum_payment"
                type="number"
                min="0"
                step="0.01"
                value={formData.minimum_payment}
                onChange={(e) => handleChange("minimum_payment", Number.parseFloat(e.target.value) || 0)}
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
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{debt ? "Update Debt" : "Add Debt"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
