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

interface Debt {
  id: string
  name: string
  type: string
  balance: number
  interestRate: number
  minimumPayment: number
  actualPayment: number
  dueDate: number
}

interface DebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt | null
  onSave: (debt: Debt) => void
}

export function DebtDialog({ open, onOpenChange, debt, onSave }: DebtDialogProps) {
  const [formData, setFormData] = useState<Partial<Debt>>({
    id: "",
    name: "",
    type: "credit-card",
    balance: 0,
    interestRate: 0,
    minimumPayment: 0,
    actualPayment: 0,
    dueDate: 1,
  })

  useEffect(() => {
    if (debt) {
      setFormData(debt)
    } else {
      setFormData({
        id: crypto.randomUUID(),
        name: "",
        type: "credit-card",
        balance: 0,
        interestRate: 0,
        minimumPayment: 0,
        actualPayment: 0,
        dueDate: 1,
      })
    }
  }, [debt, open])

  const handleChange = (field: keyof Debt, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData as Debt)
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
                  <SelectItem value="credit-card">Credit Card</SelectItem>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="auto">Auto Loan</SelectItem>
                  <SelectItem value="student">Student Loan</SelectItem>
                  <SelectItem value="personal">Personal Loan</SelectItem>
                  <SelectItem value="medical">Medical Debt</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">
                Balance ($)
              </Label>
              <Input
                id="balance"
                type="number"
                min="0"
                step="0.01"
                value={formData.balance}
                onChange={(e) => handleChange("balance", Number.parseFloat(e.target.value) || 0)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interestRate" className="text-right">
                Interest Rate (%)
              </Label>
              <Input
                id="interestRate"
                type="number"
                min="0"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => handleChange("interestRate", Number.parseFloat(e.target.value) || 0)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minimumPayment" className="text-right">
                Min. Payment ($)
              </Label>
              <Input
                id="minimumPayment"
                type="number"
                min="0"
                step="0.01"
                value={formData.minimumPayment}
                onChange={(e) => handleChange("minimumPayment", Number.parseFloat(e.target.value) || 0)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="actualPayment" className="text-right">
                Actual Payment ($)
              </Label>
              <Input
                id="actualPayment"
                type="number"
                min="0"
                step="0.01"
                value={formData.actualPayment}
                onChange={(e) => handleChange("actualPayment", Number.parseFloat(e.target.value) || 0)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Due Date (day)
              </Label>
              <Input
                id="dueDate"
                type="number"
                min="1"
                max="31"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", Number.parseInt(e.target.value) || 1)}
                className="col-span-3"
                required
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

