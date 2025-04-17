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
  categories?: any[]
  onSuccess?: () => void
}

export function BudgetForm({ budget, categories, onSuccess }: BudgetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: budget?.name || "",
    amount: budget?.amount || 0,
    start_date: budget?.start_date || new Date().toISOString().split("T")[0],
    end_date: budget?.end_date || "",
    categories: budget?.categories || []
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (step === 1) {
      const form = e.currentTarget;
      
      // Safely get input values using type casting
      const nameInput = form.querySelector('#name') as HTMLInputElement;
      const amountInput = form.querySelector('#amount') as HTMLInputElement;
      const startDateInput = form.querySelector('input[name="start_date"]') as HTMLInputElement;
      const endDateInput = form.querySelector('input[name="end_date"]') as HTMLInputElement;
      
      setFormData(prev => ({
        ...prev,
        name: nameInput?.value || prev.name,
        amount: parseFloat(amountInput?.value || prev.amount.toString()),
        start_date: startDateInput?.value || prev.start_date,
        end_date: endDateInput?.value || prev.end_date
      }));
      
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
      router.push("/budgets")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategories = (categories: any[]) => {
    setFormData(prev => ({ ...prev, categories }))
    
    // Create a synthetic event to simulate form submission
    const event = {
      preventDefault: () => {}
    } as React.FormEvent<HTMLFormElement>;
    
    handleSubmit(event);
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
              placeholder="Monthly Budget"
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
              placeholder="5000.00"
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
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/budgets")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Next
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
