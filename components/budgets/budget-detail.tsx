"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils/formatting"
import { createBudgetCategory, updateBudgetCategory, deleteBudgetCategory } from "@/app/actions/budgets"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface Category {
  id: string
  name: string
  color: string
  icon: string
  is_income: boolean
}

interface BudgetCategory {
  id: string
  budget_id: string
  category_id: string
  amount: number
  categories: Category
}

interface Budget {
  id: string
  user_id: string
  name: string
  amount: number
  start_date: string
  end_date: string
  created_at: string
  updated_at: string | null
  budget_categories: BudgetCategory[]
}

interface BudgetDetailProps {
  budget: Budget
  categories: Category[]
}

export function BudgetDetail({ budget, categories }: BudgetDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false)
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null)
  const [formData, setFormData] = useState<{
    category_id?: string
    amount: number
  }>({
    category_id: "",
    amount: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter out categories that are already in the budget
  const availableCategories = categories.filter(
    (category) =>
      !category.is_income &&
      !budget.budget_categories?.some((budgetCategory) => budgetCategory.category_id === category.id),
  )

  const totalAllocated = budget.budget_categories?.reduce((sum, category) => sum + category.amount, 0) || 0

  const remainingBudget = budget.amount - totalAllocated
  const allocationPercentage = (totalAllocated / budget.amount) * 100

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: name === "amount" ? Number.parseFloat(value) : value })
  }

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, category_id: value })
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append("budget_id", budget.id)
      formDataObj.append("category_id", formData.category_id || "")
      formDataObj.append("amount", formData.amount.toString())

      await createBudgetCategory(formDataObj)

      setIsAddCategoryDialogOpen(false)
      setFormData({ category_id: "", amount: 0 })

      toast({
        title: "Category added",
        description: "The category has been added to the budget.",
      })

      router.refresh()
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (selectedCategory) {
        const formDataObj = new FormData()
        formDataObj.append("amount", formData.amount.toString())
        formDataObj.append("budget_id", budget.id)

        await updateBudgetCategory(selectedCategory.id, formDataObj)

        setIsEditCategoryDialogOpen(false)
        setSelectedCategory(null)
        setFormData({ category_id: "", amount: 0 })

        toast({
          title: "Category updated",
          description: "The category allocation has been updated.",
        })

        router.refresh()
      }
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async () => {
    setIsSubmitting(true)

    try {
      if (selectedCategory) {
        await deleteBudgetCategory(selectedCategory.id, budget.id)

        setIsDeleteCategoryDialogOpen(false)
        setSelectedCategory(null)

        toast({
          title: "Category removed",
          description: "The category has been removed from the budget.",
        })

        router.refresh()
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to remove category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (category: BudgetCategory) => {
    setSelectedCategory(category)
    setFormData({ amount: category.amount })
    setIsEditCategoryDialogOpen(true)
  }

  const openDeleteDialog = (category: BudgetCategory) => {
    setSelectedCategory(category)
    setIsDeleteCategoryDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{budget.name}</h1>
        <p className="text-muted-foreground mt-2">
          Budget period: {formatDate(new Date(budget.start_date))} to {formatDate(new Date(budget.end_date))}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Total budget: {formatCurrency(budget.amount)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Allocated: {formatCurrency(totalAllocated)}</span>
              <span>Remaining: {formatCurrency(remainingBudget)}</span>
            </div>
            <Progress value={allocationPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Category Allocations</CardTitle>
            <CardDescription>Manage how your budget is allocated across categories</CardDescription>
          </div>
          <Button onClick={() => setIsAddCategoryDialogOpen(true)} disabled={availableCategories.length === 0}>
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Allocated Amount</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budget.budget_categories?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No categories allocated yet.
                  </TableCell>
                </TableRow>
              ) : (
                budget.budget_categories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className="h-4 w-4 rounded-full mr-2"
                          style={{ backgroundColor: category.categories.color }}
                        />
                        {category.categories.name}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(category.amount)}</TableCell>
                    <TableCell>{((category.amount / budget.amount) * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => openDeleteDialog(category)}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category to Budget</DialogTitle>
            <DialogDescription>Allocate a portion of your budget to a category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCategory}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category
                </label>
                <Select value={formData.category_id} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Amount
                </label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingBudget + (selectedCategory?.amount || 0)}
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-sm text-muted-foreground">Remaining budget: {formatCurrency(remainingBudget)}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCategoryDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.category_id}>
                {isSubmitting ? "Adding..." : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category Allocation</DialogTitle>
            <DialogDescription>Update the amount allocated to this category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Category</label>
                <div className="flex items-center">
                  {selectedCategory && (
                    <>
                      <div
                        className="h-4 w-4 rounded-full mr-2"
                        style={{ backgroundColor: selectedCategory.categories.color }}
                      />
                      {selectedCategory.categories.name}
                    </>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-amount" className="text-sm font-medium">
                  Amount
                </label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingBudget + (selectedCategory?.amount || 0)}
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Remaining budget: {formatCurrency(remainingBudget + (selectedCategory?.amount || 0))}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditCategoryDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this category from the budget?
              {selectedCategory && (
                <div className="mt-2 font-medium">
                  {selectedCategory.categories.name} - {formatCurrency(selectedCategory.amount)}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

