"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { getExpenses } from "@/app/actions/expenses"
import { useTheme } from "next-themes"
import { Expense } from "@/types/expense"

// Import D3 dynamically to avoid SSR issues
import dynamic from "next/dynamic"

// Dynamic import of the ForceGraph component
const ForceGraphWithNoSSR = dynamic(
  () => import("./force-graph").then(mod => ({ default: mod.ForceGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-muted flex items-center justify-center">
        <Skeleton className="h-[400px] w-full" />
      </div>
    ),
  }
)

type MerchantNetworkProps = {
  className?: string
}

interface NetworkNode {
  id: string
  name: string
  value: number
  count: number
  categories: string[]
}

interface NetworkLink {
  source: string
  target: string
  value: number
  categories: string[]
}

interface NetworkData {
  nodes: NetworkNode[]
  links: NetworkLink[]
}

export function MerchantNetwork({ className }: MerchantNetworkProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(2) // Minimum connections to show
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month')
  const [networkData, setNetworkData] = useState<NetworkData>({ nodes: [], links: [] })
  const { theme } = useTheme()

  // Fetch expenses data
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true)
      try {
        const data = await getExpenses()
        setExpenses(data)
      } catch (error) {
        console.error("Error fetching expenses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [timeframe])

  // Process expenses to create network data
  useEffect(() => {
    if (!expenses.length) return

    // Filter expenses by timeframe
    const now = new Date()
    let startDate = new Date()

    if (timeframe === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else if (timeframe === 'quarter') {
      startDate.setMonth(now.getMonth() - 3)
    } else {
      startDate.setFullYear(now.getFullYear() - 1)
    }

    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.spent_at)
      return expenseDate >= startDate && expenseDate <= now
    })

    // Group expenses by merchant
    const merchantGroups: Record<string, any> = {}
    filteredExpenses.forEach(expense => {
      const merchantId = expense.merchant_id
      if (!merchantId) return

      if (!merchantGroups[merchantId]) {
        merchantGroups[merchantId] = {
          id: merchantId,
          name: expense.merchant?.name || 'Unknown',
          amount: 0,
          count: 0,
          categories: new Set<string>(),
          expenses: []
        }
      }

      merchantGroups[merchantId].amount += expense.amount
      merchantGroups[merchantId].count += 1
      if (expense.category) merchantGroups[merchantId].categories.add(expense.category)
      merchantGroups[merchantId].expenses.push(expense)
    })

    // Convert to array
    const merchants = Object.values(merchantGroups)

    // Create links between merchants that share categories
    const links: NetworkLink[] = []
    const nodes: NetworkNode[] = merchants.map(merchant => ({
      id: merchant.id,
      name: merchant.name,
      value: merchant.amount,
      count: merchant.count,
      categories: Array.from(merchant.categories) as string[]
    }))

    // Create links between merchants that share categories
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const merchant1 = nodes[i]
        const merchant2 = nodes[j]

        // Find common categories
        const commonCategories = merchant1.categories.filter(cat =>
          merchant2.categories.includes(cat)
        )

        if (commonCategories.length > 0) {
          links.push({
            source: merchant1.id,
            target: merchant2.id,
            value: commonCategories.length,
            categories: commonCategories
          })
        }
      }
    }

    // Filter by threshold
    const filteredNodes = nodes.filter(node => {
      const nodeLinks = links.filter(link => 
        link.source === node.id || link.target === node.id
      )
      return nodeLinks.length >= threshold
    })
    
    const nodeIds = filteredNodes.map(node => node.id)
    const filteredLinks = links.filter(link => 
      nodeIds.includes(link.source) && nodeIds.includes(link.target)
    )
    
    setNetworkData({
      nodes: filteredNodes,
      links: filteredLinks
    })
  }, [expenses, threshold, timeframe])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Merchant Spending Network</CardTitle>
        <CardDescription>
          Visualizes relationships between merchants based on spending categories
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <div className="w-full sm:w-1/2">
            <label className="text-sm font-medium">Timeframe</label>
            <Select value={timeframe} onValueChange={(value: 'month' | 'quarter' | 'year') => setTimeframe(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-1/2">
            <label className="text-sm font-medium">Connection Threshold: {threshold}</label>
            <Slider 
              value={[threshold]} 
              min={0} 
              max={5} 
              step={1} 
              onValueChange={(values) => setThreshold(values[0])}
              className="mt-2"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : networkData.nodes.length > 0 ? (
            <ForceGraphWithNoSSR 
              data={networkData} 
              darkMode={theme === 'dark'}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-muted-foreground">No merchant connections found with current settings</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
