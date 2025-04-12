"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { getExpensesByPeriod } from "@/app/actions/expenses"
import { useTheme } from "next-themes"
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants/categories"

// Import D3 dynamically to avoid SSR issues
import dynamic from "next/dynamic"

// Dynamic import of the Sunburst component
const SunburstChartWithNoSSR = dynamic(() => import("./sunburst-chart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-muted flex items-center justify-center">
      <Skeleton className="h-[400px] w-full" />
    </div>
  ),
})

interface CategorySunburstProps {
  className?: string
}

export function CategorySunburst({ className }: CategorySunburstProps) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'current' | 'month' | 'quarter' | 'year'>('current')
  const [sunburstData, setSunburstData] = useState<any>(null)
  const { theme } = useTheme()
  
  // Extract fetchExpenses function outside useEffect to reuse it
  const fetchExpenses = async () => {
    // Only show loading indicator on initial load, not on refreshes
    const isInitialLoad = expenses.length === 0
    if (isInitialLoad) {
      setLoading(true)
    }
    
    try {
      // Pass the timeframe directly to the API
      // The API now handles 'current', 'month', 'quarter', and 'year'
      const period = timeframe === 'quarter' ? 'month' : timeframe
      const data = await getExpensesByPeriod(period)
      console.log(`Fetched ${data.length} expenses for period: ${period}`)
      setExpenses(data)
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // Effect for initial load and timeframe changes
  useEffect(() => {
    fetchExpenses()
  }, [timeframe])
  
  // Separate effect for handling expense changes
  useEffect(() => {
    // Set up listeners for expense changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'expense_added' || e.key === 'expense_updated' || e.key === 'expense_deleted') {
        fetchExpenses()
      }
    }
    
    // Also listen for direct events (for same-window updates)
    const handleCustomEvent = () => {
      fetchExpenses()
    }
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('expense_updated', handleCustomEvent)
    window.addEventListener('expense_added', handleCustomEvent)
    window.addEventListener('expense_deleted', handleCustomEvent)
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('expense_updated', handleCustomEvent)
      window.removeEventListener('expense_added', handleCustomEvent)
      window.removeEventListener('expense_deleted', handleCustomEvent)
    }
  }, [])
  
  // Process expenses to create sunburst data
  useEffect(() => {
    if (!expenses.length) {
      setSunburstData(null)
      console.log('No expenses found, setting sunburstData to null')
      return
    }
    
    console.log(`Processing ${expenses.length} expenses for sunburst chart`)
    console.log('Sample expense:', expenses[0])
    
    // Initialize with all predefined categories
    const categoryMap = new Map()
    
    // Add all predefined expense categories with zero values
    EXPENSE_CATEGORIES.forEach(categoryObj => {
      categoryMap.set(categoryObj.id, {
        id: categoryObj.id,
        name: categoryObj.name,
        children: new Map(),
        value: 0,
        color: categoryObj.color // Store the color for later use
      })
    })
    
    console.log(`Initialized ${categoryMap.size} predefined categories`)
    
    let processedCount = 0
    let skippedNoCategory = 0
    let skippedIncome = 0
    let totalAmount = 0
    
    // Process actual expenses
    expenses.forEach(expense => {
      // Get the category from the expense data
      // The API returns the category object in the expense.category property
      if (!expense.category) {
        skippedNoCategory++
        console.log('Skipping expense with no category:', expense.id, expense.description)
        return // Skip if no category
      }
      
      // Skip income categories for this visualization
      if (expense.category.is_income) {
        skippedIncome++
        return
      }
      
      const categoryId = expense.category.id
      const categoryName = expense.category.name
      const categoryColor = expense.category.color
      
      // Get merchant information
      const merchant = expense.merchant_name || expense.merchant?.name || 'Unknown Merchant'
      
      // Handle amount - ensure it's a number
      // The amount could be a string, number, or numeric string
      let amount = 0;
      if (typeof expense.amount === 'number') {
        amount = expense.amount;
      } else if (typeof expense.amount === 'string') {
        amount = parseFloat(expense.amount) || 0;
      } else if (expense.amount !== null && expense.amount !== undefined) {
        // For any other type, try to convert to number
        amount = Number(expense.amount) || 0;
      }
      
      // Debug amount parsing
      if (isNaN(amount)) {
        console.log('Invalid amount:', expense.amount, 'for expense:', expense.id, expense.description);
      } else {
        totalAmount += amount;
        processedCount++;
      }
      
      // Skip expenses with zero or invalid amounts
      if (amount <= 0 || isNaN(amount)) {
        return;
      }
      
      // Ensure the category exists in our map
      if (!categoryMap.has(categoryId)) {
        // This shouldn't happen with predefined categories, but just in case
        console.log(`Adding missing category: ${categoryName} (${categoryId})`)
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          children: new Map(),
          value: 0,
          color: categoryColor
        })
      }
      
      const categoryData = categoryMap.get(categoryId)
      
      // Update category total
      categoryData.value += amount
      console.log(`Added ${amount} to category ${categoryName}, new total: ${categoryData.value}`)
      
      // Add merchant if it doesn't exist
      if (!categoryData.children.has(merchant)) {
        categoryData.children.set(merchant, {
          name: merchant,
          value: 0,
          parent: categoryName
        })
      }
      
      // Update merchant total
      categoryData.children.get(merchant).value += amount
    })
    
    console.log(`Processed ${processedCount} expenses, skipped ${skippedNoCategory} with no category, skipped ${skippedIncome} income items`)
    console.log(`Total amount processed: ${totalAmount}`)
    
    // Check if any categories have values
    let categoriesWithValues = 0
    categoryMap.forEach((category) => {
      if (category.value > 0) {
        categoriesWithValues++
        console.log(`Category ${category.name} has value ${category.value}`)
      }
    })
    console.log(`${categoriesWithValues} categories have values > 0`)
    
    // Convert to hierarchical structure for sunburst chart
    const sunburstData = {
      name: "Expenses",
      children: Array.from(categoryMap.values())
        // Filter out categories with zero value if we have actual expenses
        .filter(category => category.value > 0)
        // Sort categories by value (highest first)
        .sort((a: any, b: any) => (b.value as number) - (a.value as number))
        .map(category => ({
          name: category.name,
          children: Array.from(category.children.values())
            // Sort merchants by value (highest first)
            .sort((a: any, b: any) => (b.value as number) - (a.value as number)),
          value: category.value,
          color: category.color // Pass the color to the chart
        }))
    }
    
    console.log('Final sunburst data:', sunburstData)
    setSunburstData(sunburstData)
  }, [expenses])
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-col space-y-2">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>
              Visualizes your spending by category and subcategory
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchExpenses} 
            title="Refresh data"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <label className="text-sm font-medium">Timeframe</label>
            <Select value={timeframe} onValueChange={(value: 'current' | 'month' | 'quarter' | 'year') => setTimeframe(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Month</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : sunburstData ? (
            <SunburstChartWithNoSSR 
              data={sunburstData} 
              darkMode={theme === 'dark'}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-muted-foreground">No expense data available for this period</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
