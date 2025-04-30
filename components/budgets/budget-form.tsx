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
    description?: string
    model?: string
    start_date: string
    end_date?: string | null
    is_active?: boolean
    categories?: any[]
  }
  categories?: any[]
  onSuccess?: () => void
}

export function BudgetForm({ budget, categories, onSuccess }: BudgetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  
  // Properly initialize formData with budget values if they exist
  const [formData, setFormData] = useState(() => {
    // If we're editing an existing budget
    if (budget?.id) {
      console.log('Initializing form with existing budget:', budget);
      
      // Map categories to ensure they have the correct structure
      const mappedCategories = budget.categories?.map((cat: any) => {
        // Get the items for this category if they exist
        const categoryItems = cat.items || [];
        const totalAmount = categoryItems.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
        
        return {
          id: cat.id,
          name: cat.name,
          description: cat.description || '',
          amount: totalAmount || cat.amount || 0,
          percentage: cat.percentage || 0,
          parent_category_id: cat.parent_category_id || null,
          subcategories: cat.subcategories?.map((sub: any) => {
            // Get the items for this subcategory if they exist
            const subItems = sub.items || [];
            const subTotalAmount = subItems.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
            
            return {
              id: sub.id,
              name: sub.name,
              description: sub.description || '',
              amount: subTotalAmount || sub.amount || 0,
              percentage: sub.percentage || 0,
              parent_category_id: cat.id
            };
          }) || []
        };
      }) || [];
      
      // Calculate total budget amount from all categories
      const totalAmount = mappedCategories.reduce((sum: number, cat: any) => {
        const catAmount = cat.amount || 0;
        const subAmount = cat.subcategories?.reduce((subSum: number, sub: any) => subSum + (sub.amount || 0), 0) || 0;
        return sum + catAmount + subAmount;
      }, 0);
      
      return {
        name: budget.name || "",
        description: budget.description || "",
        model: budget.model || "traditional",
        amount: totalAmount,
        start_date: budget.start_date || new Date().toISOString().split("T")[0],
        end_date: budget.end_date || "",
        is_active: budget.is_active !== false, // Default to true if not specified
        categories: mappedCategories
      };
    }
    
    // Default values for new budget
    return {
      name: "",
      description: "",
      model: "traditional",
      amount: 0,
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      is_active: true,
      categories: []
    };
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (step === 1) {
      const form = e.currentTarget;
      
      // Safely get input values using type casting
      const nameInput = form.querySelector('#name') as HTMLInputElement;
      const descriptionInput = form.querySelector('#description') as HTMLInputElement;
      const modelInput = form.querySelector('#model') as HTMLSelectElement;
      const amountInput = form.querySelector('#amount') as HTMLInputElement;
      const startDateInput = form.querySelector('input[name="start_date"]') as HTMLInputElement;
      const endDateInput = form.querySelector('input[name="end_date"]') as HTMLInputElement;
      
      setFormData(prev => ({
        ...prev,
        name: nameInput?.value || prev.name,
        description: descriptionInput?.value || prev.description,
        model: modelInput?.value || prev.model,
        amount: parseFloat(amountInput?.value || prev.amount.toString()),
        start_date: startDateInput?.value || prev.start_date,
        end_date: endDateInput?.value || prev.end_date
      }));
      
      setStep(2)
      return
    }

    setLoading(true)

    try {
      // Process categories to ensure all calculations are correct and optimize storage
      console.log('Original categories data:', formData.categories);
      
      const budgetData = {
        ...formData,
        categories: formData.categories.map(cat => {
          // Calculate amount from percentage if needed
          const amount = cat.amount || ((cat.percentage / 100) * formData.amount);
          
          // Create a category object with fields matching the new schema
          const categoryData = {
            id: cat.id || undefined, // Preserve original ID if it exists
            name: cat.name,
            description: cat.description || undefined,
            amount: amount, // Store amount for budget item creation
            parent_category_id: cat.parent_category_id || null
          };
          
          // Process subcategories if they exist
          if (cat.subcategories?.length) {
            console.log(`Processing ${cat.subcategories.length} subcategories for ${cat.name}`);
            
            const subcategories = cat.subcategories.map((sub: any) => {
              // Calculate amount from percentage if needed
              const subAmount = sub.amount || ((sub.percentage / 100) * amount);
              
              // Create a subcategory object with fields matching the new schema
              return {
                id: sub.id || undefined, // Preserve original ID if it exists
                name: sub.name,
                description: sub.description || undefined,
                amount: subAmount, // Store amount for budget item creation
                parent_category_id: cat.id // Link to parent category
              };
            });
            
            // Return the category with its subcategories
            return {
              ...categoryData,
              subcategories
            };
          }
          
          return categoryData;
        })
      };
      
      console.log('Submitting optimized budget data:', budgetData);
      console.log('Categories count:', budgetData.categories.length);
      console.log('First category sample:', budgetData.categories[0]);
      
      if (budget?.id) {
        console.log(`Updating budget with ID: ${budget.id}`);
        await updateBudget(budget.id, budgetData)
        toast.success("Budget updated successfully")
      } else {
        console.log('Creating new budget');
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

  const handleSaveCategories = async (categories: any[]) => {
    // Update the form data with the new categories
    setFormData(prev => ({ ...prev, categories }));
    
    // Set loading state
    setLoading(true);
    
    try {
      // Process categories to ensure all calculations are correct
      const budgetData = {
        ...formData,
        categories: categories.map(cat => {
          // Get amount_allocated directly if available, otherwise calculate from percentage
          const amount = cat.amount_allocated || ((cat.percentage / 100) * formData.amount);
          
          // Create a streamlined category object with only necessary fields
          const categoryData = {
            id: cat.id || undefined, // Preserve original ID if it exists
            name: cat.name,
            amount_allocated: amount, // Use amount_allocated or calculated amount
          };
          
          // Process subcategories if they exist
          if (cat.subcategories?.length) {
            console.log(`Processing ${cat.subcategories.length} subcategories for ${cat.name}`);
            
            const subcategories = cat.subcategories.map((sub: any) => {
              // Get amount_allocated directly if available, otherwise calculate from percentage
              const subAmount = sub.amount_allocated || ((sub.percentage / 100) * amount);
              
              // Create a streamlined subcategory object
              return {
                id: sub.id || undefined, // Preserve original ID if it exists
                name: sub.name,
                amount_allocated: subAmount, // Use amount_allocated or calculated amount
                parent_id: cat.id // Link to parent category
              };
            });
            
            // Return the category with its subcategories
            return {
              ...categoryData,
              subcategories
            };
          }
          
          return categoryData;
        })
      };
      
      console.log('Submitting budget data from handleSaveCategories:', budgetData);
      console.log('Categories count:', budgetData.categories.length);
      
      if (budget?.id) {
        console.log(`Updating budget with ID: ${budget.id}`);
        await updateBudget(budget.id, budgetData);
        toast.success("Budget updated successfully");
      } else {
        console.log('Creating new budget');
        await createBudget(budgetData);
        toast.success("Budget created successfully");
      }

      onSuccess?.();
      router.push("/budgets");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (step === 2) {
    return (
      <BudgetCategoryForm
        initialCategories={formData.categories}
        onSave={handleSaveCategories}
        useExistingCategories={true}
        budgetAmount={formData.amount}
      />
    )
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{budget ? "Edit Budget" : "Create Budget"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        {step === 1 ? (
          <>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Budget Name</Label>
                <Input id="name" defaultValue={formData.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input id="description" defaultValue={formData.description || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Budget Model</Label>
                <select 
                  id="model" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={formData.model}
                >
                  <option value="traditional">Traditional</option>
                  <option value="zero_based">Zero-Based</option>
                  <option value="fifty_thirty_twenty">50/30/20</option>
                  <option value="envelope">Envelope</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Total Budget Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={formData.amount}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <DatePicker name="start_date" date={formData.start_date ? new Date(formData.start_date) : new Date()} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <DatePicker name="end_date" date={formData.end_date ? new Date(formData.end_date) : undefined} />
                </div>
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
          </>
        ) : null}
      </form>
    </Card>
  )
}
