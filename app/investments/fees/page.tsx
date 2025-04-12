import type { Metadata } from "next"
import { getInvestmentFeeAnalysis } from "@/app/actions/investments"
import { FeeComparisonChart } from "@/components/investments/fee-comparison-chart"
import { LowerCostAlternatives } from "@/components/investments/lower-cost-alternatives"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign } from "lucide-react"

export const metadata: Metadata = {
  title: "Investment Fee Analyzer",
  description: "Analyze your investment fees and find lower-cost alternatives",
}

export default async function InvestmentFeesPage() {
  const feeAnalysis = await getInvestmentFeeAnalysis()

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Investment Fee Analyzer</h1>
        <p className="text-muted-foreground">Analyze your investment fees and find lower-cost alternatives</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Annual Fees</CardTitle>
            <CardDescription>Total fees paid yearly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${feeAnalysis.totalAnnualFees.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">
              {((feeAnalysis.totalAnnualFees / feeAnalysis.totalPortfolioValue) * 100).toFixed(2)}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Potential Savings</CardTitle>
            <CardDescription>With lower-cost alternatives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">${feeAnalysis.maxPotentialSavings.toFixed(2)}/year</div>
            <p className="text-sm text-muted-foreground">
              {feeAnalysis.highFeeInvestments.length} high-fee investments identified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>10-Year Fee Impact</CardTitle>
            <CardDescription>Estimated cost over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">${feeAnalysis.tenYearImpact.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Assumes no portfolio growth</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Comparison</CardTitle>
            <CardDescription>Expense ratios of your investments compared to industry averages</CardDescription>
          </CardHeader>
          <CardContent>
            <FeeComparisonChart investments={feeAnalysis.investments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Impact by Investment</CardTitle>
            <CardDescription>Annual fees paid for each investment</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investment</TableHead>
                  <TableHead>Expense Ratio</TableHead>
                  <TableHead className="text-right">Annual Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeAnalysis.investments
                  .sort((a, b) => b.annual_fee - a.annual_fee)
                  .slice(0, 10)
                  .map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell className="font-medium">{investment.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            investment.fee_percentage > 0.75
                              ? "destructive"
                              : investment.fee_percentage > 0.5
                                ? "default"
                                : investment.fee_percentage > 0.2
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {investment.fee_percentage.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${investment.annual_fee.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {feeAnalysis.highFeeInvestments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Lower-Cost Alternatives
            </CardTitle>
            <CardDescription>Potential savings by switching to lower-cost alternatives</CardDescription>
          </CardHeader>
          <CardContent>
            <LowerCostAlternatives highFeeInvestments={feeAnalysis.highFeeInvestments} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

