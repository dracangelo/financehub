"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SankeyNode {
  id: string
  nodeColor: string
}

interface SankeyLink {
  source: string
  target: string
  value: number
}

interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

interface SankeyDiagramProps {
  title?: string
  description?: string
  data?: SankeyData
}

// Fixed sample data for the Sankey diagram - removed circular references
const monthlyData: SankeyData = {
  nodes: [
    { id: "Income", nodeColor: "#10b981" },
    { id: "Salary", nodeColor: "#34d399" },
    { id: "Side Gigs", nodeColor: "#6ee7b7" },
    { id: "Expenses", nodeColor: "#ef4444" },
    { id: "Housing", nodeColor: "#f87171" },
    { id: "Food", nodeColor: "#fca5a5" },
    { id: "Transportation", nodeColor: "#fecaca" },
    { id: "Entertainment", nodeColor: "#fee2e2" },
    { id: "Savings", nodeColor: "#3b82f6" },
    { id: "Emergency Fund", nodeColor: "#60a5fa" },
    { id: "Retirement", nodeColor: "#93c5fd" },
    { id: "Investment", nodeColor: "#bfdbfe" },
  ],
  links: [
    // Sources of income
    { source: "Salary", target: "Income", value: 4500 },
    { source: "Side Gigs", target: "Income", value: 500 },

    // Allocation of income
    { source: "Income", target: "Expenses", value: 3500 },
    { source: "Income", target: "Savings", value: 1500 },

    // Breakdown of expenses
    { source: "Expenses", target: "Housing", value: 1800 },
    { source: "Expenses", target: "Food", value: 800 },
    { source: "Expenses", target: "Transportation", value: 500 },
    { source: "Expenses", target: "Entertainment", value: 400 },

    // Breakdown of savings
    { source: "Savings", target: "Emergency Fund", value: 500 },
    { source: "Savings", target: "Retirement", value: 700 },
    { source: "Savings", target: "Investment", value: 300 },
  ],
}

const yearlyData: SankeyData = {
  nodes: [
    { id: "Income", nodeColor: "#10b981" },
    { id: "Salary", nodeColor: "#34d399" },
    { id: "Bonus", nodeColor: "#6ee7b7" },
    { id: "Side Income", nodeColor: "#a7f3d0" },
    { id: "Expenses", nodeColor: "#ef4444" },
    { id: "Housing", nodeColor: "#f87171" },
    { id: "Food", nodeColor: "#fca5a5" },
    { id: "Transportation", nodeColor: "#fecaca" },
    { id: "Healthcare", nodeColor: "#fee2e2" },
    { id: "Entertainment", nodeColor: "#fef2f2" },
    { id: "Savings", nodeColor: "#3b82f6" },
    { id: "Emergency Fund", nodeColor: "#60a5fa" },
    { id: "Retirement", nodeColor: "#93c5fd" },
    { id: "Investment", nodeColor: "#bfdbfe" },
    { id: "Education", nodeColor: "#dbeafe" },
  ],
  links: [
    // Sources of income
    { source: "Salary", target: "Income", value: 54000 },
    { source: "Bonus", target: "Income", value: 3000 },
    { source: "Side Income", target: "Income", value: 3000 },

    // Allocation of income
    { source: "Income", target: "Expenses", value: 42000 },
    { source: "Income", target: "Savings", value: 18000 },

    // Breakdown of expenses
    { source: "Expenses", target: "Housing", value: 21600 },
    { source: "Expenses", target: "Food", value: 9600 },
    { source: "Expenses", target: "Transportation", value: 6000 },
    { source: "Expenses", target: "Healthcare", value: 2400 },
    { source: "Expenses", target: "Entertainment", value: 2400 },

    // Breakdown of savings
    { source: "Savings", target: "Emergency Fund", value: 6000 },
    { source: "Savings", target: "Retirement", value: 8400 },
    { source: "Savings", target: "Investment", value: 2400 },
    { source: "Savings", target: "Education", value: 1200 },
  ],
}

// Function to validate Sankey data and detect circular references
function validateSankeyData(data: SankeyData): { valid: boolean; message?: string } {
  // Create a directed graph from the links
  const graph: Record<string, string[]> = {}

  // Initialize graph with all nodes
  data.nodes.forEach((node) => {
    graph[node.id] = []
  })

  // Add edges to the graph
  data.links.forEach((link) => {
    if (graph[link.source]) {
      graph[link.source].push(link.target)
    } else {
      graph[link.source] = [link.target]
    }
  })

  // Function to detect cycles using DFS
  function hasCycle(node: string, visited: Set<string>, recStack: Set<string>): boolean {
    if (!visited.has(node)) {
      visited.add(node)
      recStack.add(node)

      for (const neighbor of graph[node] || []) {
        if (!visited.has(neighbor) && hasCycle(neighbor, visited, recStack)) {
          return true
        } else if (recStack.has(neighbor)) {
          return true
        }
      }
    }

    recStack.delete(node)
    return false
  }

  // Check for cycles starting from each node
  const visited = new Set<string>()
  const recStack = new Set<string>()

  for (const node of Object.keys(graph)) {
    if (!visited.has(node) && hasCycle(node, visited, recStack)) {
      return { valid: false, message: "Circular reference detected in Sankey data" }
    }
  }

  return { valid: true }
}

export function SankeyDiagram({
  title = "Money Flow",
  description = "Visualize how your money flows between income, expenses, and savings",
}: SankeyDiagramProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          {description}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  A Sankey diagram shows how resources (like money) flow from one category to another. The width of
                  each flow represents the amount.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <p className="text-muted-foreground">
            Sankey diagram visualization is temporarily unavailable
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

