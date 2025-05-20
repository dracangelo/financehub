import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Force dynamic rendering to handle cookies
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Asset Allocation Optimizer",
  description: "Optimize your investment portfolio allocation and get rebalancing recommendations",
}

export default function AssetAllocationPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Asset Allocation Optimizer</h1>
        <p className="text-muted-foreground">
          Optimize your investment portfolio allocation and get rebalancing recommendations
        </p>
      </div>
      
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Feature Coming Soon</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            The asset allocation optimizer is currently being updated. Please check back soon for detailed allocation analysis.
          </p>
          <Button asChild>
            <a href="/investments">Return to Investments</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
