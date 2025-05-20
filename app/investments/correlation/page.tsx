import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Force dynamic rendering to handle cookies
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Portfolio Correlation Analysis",
  description: "Analyze the correlation between your investments for better diversification",
}

export default function CorrelationAnalysisPage() {
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
          <h3 className="text-xl font-semibold mb-2">Feature Coming Soon</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            The portfolio correlation analysis feature is currently being updated. Please check back soon for detailed analytics.
          </p>
          <Button asChild>
            <a href="/investments">Return to Investments</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

