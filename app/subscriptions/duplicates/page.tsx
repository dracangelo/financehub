import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Duplicate Service Detection",
  description: "Find overlapping subscriptions and reduce unnecessary costs",
}

export const dynamic = 'force-dynamic'

export default function DuplicateServicesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Duplicate Service Detection</h1>
        <p className="text-muted-foreground">Find overlapping subscriptions and reduce unnecessary costs</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Subscription Overlap Analysis</CardTitle>
          <CardDescription>Identify potential duplicate services</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Feature Coming Soon</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            The subscription duplicate detection feature is currently being updated. Please check back soon for detailed analysis.
          </p>
          <Button asChild>
            <Link href="/subscriptions">Return to Subscriptions</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
