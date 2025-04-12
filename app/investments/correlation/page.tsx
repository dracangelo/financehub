import type { Metadata } from "next"
import { getPortfolioCorrelation } from "@/app/actions/investments"
import { CorrelationHeatmap } from "@/components/investments/correlation-heatmap"
import { DiversificationScore } from "@/components/investments/diversification-score"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Portfolio Correlation Analysis",
  description: "Analyze the correlation between your investments for better diversification",
}

export default async function CorrelationAnalysisPage() {
  const correlationData = await getPortfolioCorrelation()

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Correlation Analysis</h1>
        <p className="text-muted-foreground">
          Analyze the correlation between your investments for better diversification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Diversification Score</CardTitle>
            <CardDescription>Higher is better</CardDescription>
          </CardHeader>
          <CardContent>
            <DiversificationScore score={correlationData.diversificationScore} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Investments</CardTitle>
            <CardDescription>In correlation analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{correlationData.investments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Average Correlation</CardTitle>
            <CardDescription>Between investments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(1 - correlationData.diversificationScore).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Lower correlation means better diversification</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Correlation Heatmap</CardTitle>
          <CardDescription>Visualize how your investments move in relation to each other</CardDescription>
        </CardHeader>
        <CardContent>
          <CorrelationHeatmap
            investments={correlationData.investments}
            correlationMatrix={correlationData.correlationMatrix}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investment Correlation Analysis</CardTitle>
          <CardDescription>Average correlation of each investment with the rest of your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Average Correlation</TableHead>
                <TableHead>Diversification Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {correlationData.averageCorrelations
                .sort((a, b) => a.average_correlation - b.average_correlation)
                .map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">{investment.name}</TableCell>
                    <TableCell>{investment.investment_type}</TableCell>
                    <TableCell>{investment.average_correlation.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          investment.average_correlation < 0.3
                            ? "outline"
                            : investment.average_correlation < 0.5
                              ? "secondary"
                              : investment.average_correlation < 0.7
                                ? "default"
                                : "destructive"
                        }
                      >
                        {investment.average_correlation < 0.3
                          ? "Excellent"
                          : investment.average_correlation < 0.5
                            ? "Good"
                            : investment.average_correlation < 0.7
                              ? "Fair"
                              : "Poor"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

