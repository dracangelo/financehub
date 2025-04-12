"use client"

import { useState } from "react"
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface BudgetCategory {
  id?: string
  name: string
  amount: number
  percentage: number
  subcategories?: BudgetCategory[]
}

const defaultCategories: BudgetCategory[] = [
  {
    name: "Housing",
    amount: 0,
    percentage: 30,
    subcategories: [
      { name: "Rent/Mortgage", amount: 0, percentage: 0 },
      { name: "Utilities", amount: 0, percentage: 0 },
      { name: "Internet", amount: 0, percentage: 0 },
      { name: "Maintenance", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Transportation",
    amount: 0,
    percentage: 15,
    subcategories: [
      { name: "Car Payment", amount: 0, percentage: 0 },
      { name: "Gas", amount: 0, percentage: 0 },
      { name: "Insurance", amount: 0, percentage: 0 },
      { name: "Maintenance", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Food",
    amount: 0,
    percentage: 15,
    subcategories: [
      { name: "Groceries", amount: 0, percentage: 0 },
      { name: "Dining Out", amount: 0, percentage: 0 }
    ]
  },
  {
    name: "Utilities",
    amount: 0,
    percentage: 10,
    subcategories: [
      { name: "Electricity", amount: 0, percentage: 0 },
      { name: "Water", amount: 0, percentage: 0 },
      { name: "Gas", amount: 0, percentage: 0 },
      { name: "Internet", amount: 0, percentage: 0 },
      { name: "Phone", amount: 0, percentage: 0 }
    ]
  }
]

interface CategoryFormProps {
  category: BudgetCategory
  onUpdate: (category: BudgetCategory) => void
  onDelete: () => void
  isSubcategory?: boolean
}

function CategoryForm({ category, onUpdate, onDelete, isSubcategory = false }: CategoryFormProps) {
  const handleChange = (field: keyof BudgetCategory, value: string | number) => {
    onUpdate({
      ...category,
      [field]: value
    })
  }

  return (
    <div className={cn(
      "grid gap-4",
      isSubcategory ? "grid-cols-[1fr_100px_40px]" : "grid-cols-[1fr_100px_100px_40px]"
    )}>
      <div>
        <Input
          placeholder="Category name"
          value={category.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>
      <div>
        <Input
          type="number"
          placeholder="Amount"
          value={category.amount || ""}
          onChange={(e) => handleChange("amount", parseFloat(e.target.value) || 0)}
        />
      </div>
      {!isSubcategory && (
        <div>
          <Input
            type="number"
            placeholder="Percentage"
            value={category.percentage || ""}
            onChange={(e) => handleChange("percentage", parseFloat(e.target.value) || 0)}
          />
        </div>
      )}
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface BudgetCategoryFormProps {
  onSave: (categories: BudgetCategory[]) => void
  initialCategories?: BudgetCategory[]
}

export function BudgetCategoryForm({ onSave, initialCategories }: BudgetCategoryFormProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>(initialCategories || defaultCategories)
  const [openCategories, setOpenCategories] = useState<string[]>([])

  const toggleCategory = (name: string) => {
    setOpenCategories(prev => 
      prev.includes(name) 
        ? prev.filter(c => c !== name)
        : [...prev, name]
    )
  }

  const addCategory = () => {
    setCategories(prev => [...prev, {
      name: "",
      amount: 0,
      percentage: 0,
      subcategories: []
    }])
  }

  const addSubcategory = (categoryIndex: number) => {
    setCategories(prev => {
      const newCategories = [...prev]
      if (!newCategories[categoryIndex].subcategories) {
        newCategories[categoryIndex].subcategories = []
      }
      newCategories[categoryIndex].subcategories?.push({
        name: "",
        amount: 0,
        percentage: 0
      })
      return newCategories
    })
  }

  const updateCategory = (categoryIndex: number, updatedCategory: BudgetCategory) => {
    setCategories(prev => {
      const newCategories = [...prev]
      newCategories[categoryIndex] = updatedCategory
      return newCategories
    })
  }

  const updateSubcategory = (categoryIndex: number, subcategoryIndex: number, updatedSubcategory: BudgetCategory) => {
    setCategories(prev => {
      const newCategories = [...prev]
      if (newCategories[categoryIndex].subcategories) {
        newCategories[categoryIndex].subcategories![subcategoryIndex] = updatedSubcategory
      }
      return newCategories
    })
  }

  const deleteCategory = (categoryIndex: number) => {
    setCategories(prev => prev.filter((_, index) => index !== categoryIndex))
  }

  const deleteSubcategory = (categoryIndex: number, subcategoryIndex: number) => {
    setCategories(prev => {
      const newCategories = [...prev]
      if (newCategories[categoryIndex].subcategories) {
        newCategories[categoryIndex].subcategories = 
          newCategories[categoryIndex].subcategories!.filter((_, index) => index !== subcategoryIndex)
      }
      return newCategories
    })
  }

  const handleSave = () => {
    onSave(categories)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category, categoryIndex) => (
          <Collapsible
            key={categoryIndex}
            open={openCategories.includes(category.name)}
            onOpenChange={() => toggleCategory(category.name)}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {openCategories.includes(category.name) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <div className="flex-1">
                  <CategoryForm
                    category={category}
                    onUpdate={(updated) => updateCategory(categoryIndex, updated)}
                    onDelete={() => deleteCategory(categoryIndex)}
                  />
                </div>
              </div>
              
              <CollapsibleContent className="space-y-2">
                {category.subcategories?.map((subcategory, subcategoryIndex) => (
                  <div key={subcategoryIndex} className="ml-6">
                    <CategoryForm
                      category={subcategory}
                      onUpdate={(updated) => updateSubcategory(categoryIndex, subcategoryIndex, updated)}
                      onDelete={() => deleteSubcategory(categoryIndex, subcategoryIndex)}
                      isSubcategory
                    />
                  </div>
                ))}
                <div className="ml-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSubcategory(categoryIndex)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subcategory
                  </Button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        <div className="flex justify-between">
          <Button variant="outline" onClick={addCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={handleSave}>Save Categories</Button>
        </div>
      </CardContent>
    </Card>
  )
}
