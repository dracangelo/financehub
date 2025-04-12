"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/investments/calculations"
import type { Investment } from "@/lib/investments/calculations"

interface PortfolioInvestmentTableProps {
  investments: Investment[]
}

export function PortfolioInvestmentTable({ investments }: PortfolioInvestmentTableProps) {
  // Sort investments by value (highest first)
  const sortedInvestments = [...investments].sort((a, b) => b.value - a.value)

  // Calculate total value
  const totalValue = sortedInvestments.reduce((sum, inv) => sum + inv.value, 0)

  // Format investment type for display
  function formatInvestmentType(type: string | undefined): string {
    if (!type) return "Unknown"
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Format tax location for display
  function formatTaxLocation(location: string | undefined): string {
    if (!location) return "Unknown"
    switch (location) {
      case "taxable":
        return "Taxable"
      case "tax_deferred":
        return "Tax-Deferred"
      case "tax_free":
        return "Tax-Free"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="space-y-4">
      {investments.length === 0 ? (
        <div className="text-center p-4 border rounded-lg">
          <p className="text-muted-foreground">No investments found.</p>
          <p className="text-sm">Add investments to see them here.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Investment</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Allocation</TableHead>
              <TableHead>Cost Basis</TableHead>
              <TableHead>Gain/Loss</TableHead>
              <TableHead>Account Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvestments.map((investment) => {
              const gainLoss = investment.value - (investment.costBasis || 0)
              const gainLossPercent = investment.costBasis ? (gainLoss / investment.costBasis) * 100 : 0
              const allocation = (investment.value / totalValue) * 100

              return (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">
                    {investment.name}
                    {investment.ticker && <span className="text-muted-foreground ml-1">({investment.ticker})</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {formatInvestmentType(investment.assetClass)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(investment.value)}</TableCell>
                  <TableCell>{allocation.toFixed(1)}%</TableCell>
                  <TableCell>{formatCurrency(investment.costBasis || 0)}</TableCell>
                  <TableCell className={gainLoss >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(gainLoss)} ({gainLossPercent.toFixed(1)}%)
                  </TableCell>
                  <TableCell>{formatTaxLocation(investment.accountType)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

