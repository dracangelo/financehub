import type { Metadata } from "next"
import { getPortfolioCorrelation } from "@/app/actions/investments"
import { CorrelationHeatmap } from "@/components/investments/correlation-heatmap"
import { DiversificationScore } from "@/components/investments/diversification-score"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Portfolio Correlation Analysis",
  description: "Analyze the correlation between your investments for better diversification",
}

export default async function CorrelationAnalysisPage() {
  const correlationData = await getPortfolioCorrelation()
  
  // Handle empty data case
  if (!correlationData.investments || correlationData.investments.length === 0) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Correlation Analysis</h1>
          <p className="text-muted-foreground">
            Analyze the correlation between your investments for better diversification
          </p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h7" />
                <path d="M21 16.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" />
                <path d="m18.5 15 2 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Investment Data Found</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Add at least two investments to your portfolio to see correlation analysis and diversification metrics.
            </p>
            <Button asChild>
              <a href="/investments">Manage Investments</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <p className="text-sm text-muted-foreground">
              {correlationData.diversificationScore > 0.7 
                ? "Your portfolio has excellent diversification" 
                : correlationData.diversificationScore > 0.5 
                ? "Your portfolio has good diversification" 
                : correlationData.diversificationScore > 0.3 
                ? "Your portfolio could use more diversification" 
                : "Your portfolio needs significant diversification"}
            </p>
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
            investments={correlationData.investments.map(inv => ({
              id: inv.id,
              name: inv.name,
              ticker: inv.ticker,
              type: inv.investment_type
            }))}
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
              {correlationData.averageCorrelations && correlationData.averageCorrelations.length > 0 ? (
                correlationData.averageCorrelations
                  .sort((a, b) => a.average_correlation - b.average_correlation)
                  .map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell className="font-medium">
                        {investment.name}
                        {investment.ticker && <span className="text-muted-foreground ml-1">({investment.ticker})</span>}
                      </TableCell>
                      <TableCell className="capitalize">{investment.investment_type.replace('_', ' ')}</TableCell>
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
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    No correlation data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

