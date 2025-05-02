"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BudgetEditDialog } from "./budget-edit-dialog"
import { BudgetDeleteDialog } from "./budget-delete-dialog"
import { Eye, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/formatting"

interface BudgetItem {
  id: string
  category_id: string
  amount: number | string
  actual_amount: number
  notes?: string
}

interface Budget {
  id: string
  name: string
  start_date: string
  end_date?: string | null
  is_collaborative?: boolean
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
  // These will be calculated from budget items
  total_allocated?: number
}

interface BudgetListProps {
  budgets: Budget[]
}

interface CategorySegment {
  id: string
  name: string
  percentage: number
  amount: number
  color: string
}

export function BudgetList({ budgets }: BudgetListProps) {
  const router = useRouter()
  
  const handleRefresh = () => {
    router.refresh()
  }

  // Function to count total categories and subcategories
  const countCategories = (budget: Budget) => {
    if (!budget.categories || budget.categories.length === 0) {
      return { categories: 0, subcategories: 0 };
    }

    const categories = budget.categories.length;
    const subcategories = budget.categories.reduce((total: number, cat) => {
      return total + (cat.subcategories?.length || 0);
    }, 0);

    return { categories, subcategories };
  };

  // Function to generate segments for the progress bar
  const generateSegments = (budget: Budget): CategorySegment[] => {
    if (!budget.categories || budget.categories.length === 0) {
      return [];
    }

    // Generate a color for each category
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-red-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500'
    ];

    // Calculate total budget amount from all items
    const totalBudgetAmount = budget.categories?.reduce((total, cat) => {
      const catAmount = cat.items?.reduce(
        (sum, item) => sum + (parseFloat(item.amount as string) || 0), 0
      ) || 0;
      
      const subCatAmount = cat.subcategories?.reduce((subTotal, subCat) => {
        return subTotal + (subCat.items?.reduce(
          (subSum, item) => subSum + (parseFloat(item.amount as string) || 0), 0
        ) || 0);
      }, 0) || 0;
      
      return total + catAmount + subCatAmount;
    }, 0) || 0;
    
    return budget.categories.map((category, index: number): CategorySegment => {
      // Get amount from items only
      const categoryAmount = category.items?.reduce(
        (sum: number, item: BudgetItem) => sum + (parseFloat(item.amount as string) || 0), 0
      ) || category.amount || 0;
      
      const percentage = totalBudgetAmount > 0 ? (categoryAmount / totalBudgetAmount) * 100 : 0;
      
      return {
        id: category.id,
        name: category.name,
        percentage: percentage,
        amount: categoryAmount,
        color: colors[index % colors.length]
      };
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {budgets.length === 0 ? (
        <div className="col-span-full text-center p-8">
          <p className="text-muted-foreground">No budgets found. Create your first budget to get started.</p>
        </div>
      ) : (
        budgets.map((budget) => {
          // Calculate budget metrics - get total from all items in all categories and subcategories
          const totalAllocated = budget.categories?.reduce(
            (sum, cat) => {
              // Get amount from category items
              const categoryAmount = cat.items?.reduce(
                (itemSum: number, item: BudgetItem) => itemSum + (parseFloat(item.amount as string) || 0), 0
              ) || 0;
              
              // Get amount from subcategory items
              const subcategoryAmount = cat.subcategories?.reduce((subSum, subCat) => {
                const subCatAmount = subCat.items?.reduce(
                  (subItemSum: number, item: BudgetItem) => subItemSum + (parseFloat(item.amount as string) || 0), 0
                ) || 0;
                return subSum + subCatAmount;
              }, 0) || 0;
              
              return sum + categoryAmount + subcategoryAmount;
            }, 
            0
          ) || 0
          
          // Store the calculated total for reference
          budget.total_allocated = totalAllocated;
          
          // Calculate remaining budget - since we don't have an income field, we'll use the total allocated as the budget amount
          const totalBudgetAmount = totalAllocated; // This is our budget amount
          const remainingBudget = 0; // Since all money is allocated, remaining is 0
          const allocationPercentage = 100; // All money is allocated
          
          // Count categories and subcategories
          const { categories, subcategories } = countCategories(budget)
          
          // Prepare data for the segmented progress bar
          const categorySegments = generateSegments(budget)
          
          return (
            <Card key={budget.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {budget.name || "Untitled Budget"}
                    </CardTitle>
                    <CardDescription>
                      {formatCurrency(budget.total_allocated || 0)}
                    </CardDescription>
                  </div>
                  {budget.is_collaborative && (
                    <Badge variant="outline" className="ml-2">
                      Collaborative
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-3">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{new Date(budget.start_date).toLocaleDateString()}</span>
                    </div>
                    {budget.end_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date:</span>
                        <span>{new Date(budget.end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categories:</span>
                      <span>{categories}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Allocated:</span>
                      <span>{formatCurrency(totalAllocated)}</span>
                    </div>
                    {subcategories > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subcategories:</span>
                        <span>{subcategories}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Budget</span>
                      <span className="text-sm font-medium">{formatCurrency(budget.total_allocated || 0)}</span>
                    </div>
                    
                    <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`absolute left-0 top-0 h-full ${allocationPercentage > 100 ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
                      />
                      
                      {/* Segmented progress bar showing category distribution */}
                      <div className="absolute left-0 top-0 h-full w-full flex">
                        {categorySegments.map((segment: CategorySegment, index: number) => (
                          <div
                            key={segment.id || index}
                            className="h-full relative group"
                            style={{ 
                              width: `${Math.min(segment.percentage, 100)}%`,
                              backgroundColor: segment.color,
                              transition: 'width 0.3s ease'
                            }}
                            title={`${segment.name}: ${formatCurrency(segment.amount)}`}
                          >
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-background border rounded shadow text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <p className="font-medium">{segment.name}</p>
                              <p>{formatCurrency(segment.amount)} ({segment.percentage.toFixed(1)}%)</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining:</span>
                      <span className={remainingBudget < 0 ? 'text-destructive' : ''}>
                        {formatCurrency(remainingBudget)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/budgets/${budget.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </a>
                </Button>
                <div className="flex gap-2">
                  <BudgetEditDialog 
                    budget={budget} 
                    onSuccess={handleRefresh} 
                  />
                  <BudgetDeleteDialog 
                    budgetId={budget.id} 
                    budgetName={budget.name || "Untitled Budget"}
                    onSuccess={handleRefresh} 
                  />
                </div>
              </CardFooter>
            </Card>
          )
        })
      )}
    </div>
  )
}
