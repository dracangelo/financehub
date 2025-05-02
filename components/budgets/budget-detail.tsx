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
  amount_allocated: number
  categories?: Category
  percentage?: number
  name?: string
}

interface BudgetItem {
  id: string
  category_id: string
  amount: number | string
  actual_amount: number
  notes?: string
}

interface Budget {
  id: string
  user_id: string
  name: string
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string | null
  budget_categories: BudgetCategory[] | null
  budget_category: BudgetCategory[] | null
  // These fields will be calculated
  total_allocated?: number
  categories?: {
    id: string
    name: string
    amount?: number
    items?: BudgetItem[]
    subcategories?: {
      id: string
      name: string
      amount?: number
      items?: BudgetItem[]
    }[]
  }[]
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
    amount_allocated: number
  }>({
    category_id: "",
    amount_allocated: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter out categories that are already in the budget
  const availableCategories = categories.filter(
    (category) =>
      !category.is_income &&
      !budget.budget_categories?.some((budgetCategory) => budgetCategory.category_id === category.id),
  )

  // Calculate total allocated amount from budget items in categories and subcategories
  const calculateTotalAllocated = () => {
    if (budget.categories && budget.categories.length > 0) {
      return budget.categories.reduce((sum, category) => {
        // Get amount from category items
        const categoryAmount = category.items?.reduce(
          (itemSum, item) => itemSum + (parseFloat(item.amount as string) || 0), 0
        ) || 0;
        
        // Get amount from subcategory items
        const subcategoryAmount = category.subcategories?.reduce((subSum, subCat) => {
          const subCatAmount = subCat.items?.reduce(
            (subItemSum, item) => subItemSum + (parseFloat(item.amount as string) || 0), 0
          ) || 0;
          return subSum + subCatAmount;
        }, 0) || 0;
        
        return sum + categoryAmount + subcategoryAmount;
      }, 0);
    } else if (budget.budget_categories) {
      // Fall back to budget_categories if available
      return budget.budget_categories.reduce((sum, category) => sum + (category.amount_allocated || 0), 0);
    }
    return 0;
  };
  
  const totalAllocated = budget.total_allocated || calculateTotalAllocated();
  const totalBudgetAmount = totalAllocated; // Use total allocated as the budget amount
  const remainingBudget = 0; // Since all money is allocated, remaining is 0
  const allocationPercentage = 100; // All money is allocated

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: name === "amount_allocated" ? Number.parseFloat(value) : value })
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
      
      // Get the selected category
      const selectedCategory = categories.find(cat => cat.id === formData.category_id)
      if (!selectedCategory) {
        throw new Error("Selected category not found")
      }
      
      // Include both category_id and name in the form data
      formDataObj.append("category_id", formData.category_id || "")
      formDataObj.append("name", selectedCategory.name)
      formDataObj.append("amount_allocated", formData.amount_allocated.toString())

      await createBudgetCategory(formDataObj)

      setIsAddCategoryDialogOpen(false)
      setFormData({ category_id: "", amount_allocated: 0 })

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
        formDataObj.append("amount_allocated", formData.amount_allocated.toString())
        formDataObj.append("budget_id", budget.id)

        await updateBudgetCategory(selectedCategory.id, formDataObj)

        setIsEditCategoryDialogOpen(false)
        setSelectedCategory(null)
        setFormData({ category_id: "", amount_allocated: 0 })

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
        await deleteBudgetCategory(budget.id, selectedCategory.id)

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
    // Ensure amount_allocated is a valid number, defaulting to 0 if it's NaN
    const amount = typeof category.amount_allocated === 'number' && !isNaN(category.amount_allocated) 
      ? category.amount_allocated 
      : 0
    setFormData({ amount_allocated: amount })
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
          <CardDescription>Total budget: {formatCurrency(totalAllocated)}</CardDescription>
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
          {/* Display categories and subcategories with allocations */}
          {budget.categories && budget.categories.length > 0 ? (
            <div className="space-y-6">
              {budget.categories.map(category => {
                // Calculate category amount
                const categoryAmount = category.items?.reduce(
                  (sum, item) => sum + (parseFloat(item.amount as string) || 0), 0
                ) || category.amount || 0;
                
                // Calculate category percentage
                const categoryPercentage = totalAllocated > 0 ? (categoryAmount / totalAllocated) * 100 : 0;
                
                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div
                          className="h-4 w-4 rounded-full mr-2"
                          style={{ backgroundColor: "#6E56CF" }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div>{formatCurrency(categoryAmount)}</div>
                        <div className="text-sm text-muted-foreground">{categoryPercentage.toFixed(1)}% of total</div>
                      </div>
                    </div>
                    
                    <Progress value={categoryPercentage} className="h-2" />
                    
                    {/* Display subcategories if they exist */}
                    {category.subcategories && category.subcategories.length > 0 && (
                      <div className="pl-6 space-y-3 mt-2 border-l-2 border-muted">
                        {category.subcategories.map(subcategory => {
                          // Calculate subcategory amount
                          const subcategoryAmount = subcategory.items?.reduce(
                            (sum, item) => sum + (parseFloat(item.amount as string) || 0), 0
                          ) || subcategory.amount || 0;
                          
                          // Calculate subcategory percentage relative to parent category
                          const subcategoryPercentage = categoryAmount > 0 ? (subcategoryAmount / categoryAmount) * 100 : 0;
                          
                          return (
                            <div key={subcategory.id} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div
                                    className="h-3 w-3 rounded-full mr-2"
                                    style={{ backgroundColor: "#9E8CFC" }}
                                  />
                                  <span className="text-sm">{subcategory.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm">{formatCurrency(subcategoryAmount)}</div>
                                  <div className="text-xs text-muted-foreground">{subcategoryPercentage.toFixed(1)}% of {category.name}</div>
                                </div>
                              </div>
                              <Progress value={subcategoryPercentage} className="h-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : budget.budget_categories && budget.budget_categories.length > 0 ? (
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
                {budget.budget_categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className="h-4 w-4 rounded-full mr-2"
                          style={{ backgroundColor: category.categories?.color || "#6E56CF" }}
                        />
                        {category.name || category.categories?.name || "Unnamed Category"}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(category.amount_allocated)}</TableCell>
                    <TableCell>{category.percentage?.toFixed(1)}%</TableCell>
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
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No categories allocated yet.
            </div>
          )}
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
                  name="amount_allocated"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingBudget + (selectedCategory?.amount_allocated || 0)}
                  value={formData.amount_allocated}
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
                        style={{ backgroundColor: selectedCategory.categories?.color }}
                      />
                      {selectedCategory.name}
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
                  name="amount_allocated"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingBudget + (selectedCategory?.amount_allocated || 0)}
                  value={formData.amount_allocated}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Remaining budget: {formatCurrency(remainingBudget + (selectedCategory?.amount_allocated || 0))}
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
                  {selectedCategory.name} - {formatCurrency(selectedCategory.amount_allocated)}
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
