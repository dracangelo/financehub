import { Metadata } from "next"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering to handle cookies
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Investment Performance",
  description: "Track and analyze your investment portfolio performance",
}

export default function InvestmentPerformancePage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Investment Performance</h1>
        <p className="text-muted-foreground">Track and analyze your investment portfolio performance over time.</p>
      </div>
      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl font-bold mb-2">+15.8%</div>
            <div className="text-sm text-muted-foreground mb-8">1 Year Performance</div>
            <p className="text-center text-muted-foreground">
              Performance charts are being updated. Please check back soon for detailed analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
