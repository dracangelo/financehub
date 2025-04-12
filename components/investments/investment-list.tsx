"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/formatting"
import { useEffect, useState } from "react"
import { getInvestments } from "@/app/actions/investments"

export interface Investment {
  id: string
  name: string
  ticker?: string
  type: string
  value: number
  costBasis: number
  allocation: number
}

interface InvestmentListProps {
  initialInvestments?: Investment[]
}

export function InvestmentList({ initialInvestments }: InvestmentListProps) {
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments || [])
  const [isLoading, setIsLoading] = useState(!initialInvestments)

  useEffect(() => {
    if (!initialInvestments) {
      const fetchInvestments = async () => {
        try {
          const data = await getInvestments()
          // Map the data to match the Investment interface
          const formattedInvestments = data.map((inv) => ({
            id: inv.id,
            name: inv.name,
            ticker: inv.ticker || undefined,
            type: inv.type,
            value: inv.value,
            costBasis: inv.cost_basis,
            allocation: inv.allocation,
          }))
          setInvestments(formattedInvestments)
        } catch (error) {
          console.error("Error fetching investments:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchInvestments()
    }
  }, [initialInvestments])

  // Sort investments by value (largest first)
  const sortedInvestments = [...investments].sort((a, b) => b.value - a.value)

  if (isLoading) {
    return <div>Loading investments...</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Cost Basis</TableHead>
            <TableHead>Gain/Loss</TableHead>
            <TableHead>Allocation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvestments.map((investment) => {
            const gainLoss = investment.value - investment.costBasis
            const gainLossPercent = (gainLoss / investment.costBasis) * 100

            return (
              <TableRow key={investment.id}>
                <TableCell className="font-medium">
                  {investment.name}
                  {investment.ticker && <span className="text-muted-foreground ml-1">({investment.ticker})</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {investment.type.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(investment.value)}</TableCell>
                <TableCell>{formatCurrency(investment.costBasis)}</TableCell>
                <TableCell>
                  <span className={gainLoss > 0 ? "text-green-600" : gainLoss < 0 ? "text-red-600" : ""}>
                    {formatCurrency(gainLoss)} ({gainLossPercent.toFixed(1)}%)
                  </span>
                </TableCell>
                <TableCell>{investment.allocation.toFixed(1)}%</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

