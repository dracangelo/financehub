"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createBudget, updateBudget } from "@/app/actions/budgets"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { Loader2 } from "lucide-react"
import { BudgetCategoryForm } from "./budget-category-form"

interface BudgetFormProps {
  budget?: {
    id: string
    name: string
    amount: number
    start_date: string
    end_date?: string | null
    categories?: any[]
  }
  onSuccess?: () => void
}

export function BudgetForm({ budget, onSuccess }: BudgetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: budget?.name || "",
    amount: budget?.amount || 0,
    start_date: budget?.start_date || "",
    end_date: budget?.end_date || "",
    categories: budget?.categories || []
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (step === 1) {
      const form = e.currentTarget
      setFormData(prev => ({
        ...prev,
        name: form.name.value,
        amount: parseFloat(form.amount.value),
        start_date: form.start_date.value,
        end_date: form.end_date.value
      }))
      setStep(2)
      return
    }

    setLoading(true)

    try {
      const budgetData = {
        ...formData,
        categories: formData.categories.map(cat => ({
          ...cat,
          amount: (cat.percentage / 100) * formData.amount,
          subcategories: cat.subcategories?.map((sub: any) => ({
            ...sub,
            amount: (sub.percentage / 100) * ((cat.percentage / 100) * formData.amount)
          }))
        }))
      }
      
      if (budget?.id) {
        await updateBudget(budget.id, budgetData)
        toast.success("Budget updated successfully")
      } else {
        await createBudget(budgetData)
        toast.success("Budget created successfully")
      }

      onSuccess?.()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategories = (categories: any[]) => {
    setFormData(prev => ({ ...prev, categories }))
    handleSubmit(new Event('submit') as any)
  }

  if (step === 2) {
    return (
      <BudgetCategoryForm
        initialCategories={formData.categories}
        onSave={handleSaveCategories}
      />
    )
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{budget ? "Edit Budget" : "Create Budget"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Budget Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={formData.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Total Budget Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={formData.amount}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <DatePicker
              id="start_date"
              name="start_date"
              defaultValue={formData.start_date}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date (Optional)</Label>
            <DatePicker
              id="end_date"
              name="end_date"
              defaultValue={formData.end_date}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Next
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
