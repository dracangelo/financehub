"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getExpensesByPeriod } from "@/app/actions/expenses"
import { cn } from "@/lib/utils"
import * as d3 from "d3"

interface CategorySunburstChartProps {
  className?: string
}

interface SunburstData {
  name: string
  value: number
  color: string
  children?: SunburstData[]
}

export function CategorySunburstChart({ className }: CategorySunburstChartProps) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<SunburstData | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true)
      try {
        const data = await getExpensesByPeriod("month")
        setExpenses(data)
        
        if (svgRef.current) {
          renderSunburst(data)
        }
      } catch (error) {
        console.error("Error fetching expenses:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchExpenses()
  }, [])

  const renderSunburst = (data: any[]) => {
    if (!svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Process data for sunburst
    const processedData = processDataForSunburst(data)
    
    // Set up dimensions
    const width = 600
    const height = 600
    const radius = Math.min(width, height) / 2

    // Create color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)

    // Create partition layout
    const partition = d3.partition()
      .size([2 * Math.PI, radius])

    // Create root node
    const root = d3.hierarchy(processedData)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value)

    // Generate the partition layout
    partition(root)

    // Create arc generator
    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1)

    // Add arcs
    svg.selectAll("path")
      .data(root.descendants())
      .enter()
      .append("path")
      .attr("d", arc)
      .style("fill", d => d.data.color || colorScale(d.data.name))
      .style("stroke", "#fff")
      .style("stroke-width", "2px")
      .on("mouseover", (event, d) => {
        setHoveredNode(d.data)
        d3.select(event.currentTarget)
          .style("stroke-width", "3px")
          .style("stroke", "#000")
      })
      .on("mouseout", (event) => {
        setHoveredNode(null)
        d3.select(event.currentTarget)
          .style("stroke-width", "2px")
          .style("stroke", "#fff")
      })

    // Add labels
    svg.selectAll("text")
      .data(root.descendants().filter(d => d.depth > 0))
      .enter()
      .append("text")
      .attr("transform", d => {
        const x = arc.centroid(d)[0]
        const y = arc.centroid(d)[1]
        const rotation = (d.x0 + d.x1) / 2 * 180 / Math.PI - 90
        return `translate(${x},${y}) rotate(${rotation})`
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(d => d.data.name)
  }

  const processDataForSunburst = (data: any[]): SunburstData => {
    // Group by category
    const categories: { [key: string]: { name: string, value: number, color: string, children: { [key: string]: { name: string, value: number } } } } = {}
    
    data.forEach(expense => {
      if (expense.category) {
        const categoryId = expense.category.id
        if (!categories[categoryId]) {
          categories[categoryId] = {
            name: expense.category.name,
            value: 0,
            color: expense.category.color || "#888888",
            children: {}
          }
        }
        categories[categoryId].value += expense.amount

        // Group by merchant within category
        if (expense.merchant) {
          if (!categories[categoryId].children[expense.merchant]) {
            categories[categoryId].children[expense.merchant] = {
              name: expense.merchant,
              value: 0
            }
          }
          categories[categoryId].children[expense.merchant].value += expense.amount
        }
      }
    })
    
    // Convert to sunburst data structure
    return {
      name: "Expenses",
      value: 0,
      color: "#ffffff",
      children: Object.values(categories).map(category => ({
        name: category.name,
        value: category.value,
        color: category.color,
        children: Object.values(category.children).map(merchant => ({
          name: merchant.name,
          value: merchant.value,
          color: category.color
        }))
      }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
  return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Category Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <svg ref={svgRef}></svg>
          
          {hoveredNode && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h3 className="font-medium">{hoveredNode.name}</h3>
              <p className="text-sm text-gray-600">
                Amount: {formatCurrency(hoveredNode.value)}
              </p>
              {hoveredNode.children && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium">Top Merchants:</h4>
                  <div className="mt-1 space-y-1">
                    {hoveredNode.children
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5)
                      .map((merchant, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{merchant.name}</span>
                          <span>{formatCurrency(merchant.value)}</span>
          </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
              </div>
          </CardContent>
        </Card>
  )
}

