import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Repeat } from "lucide-react"

export const dynamic = "force-dynamic"

export default function SubscriptionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <Repeat className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        </div>
        <p className="text-muted-foreground">
          Monitor and manage your recurring subscriptions.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>View and manage your active subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Track your recurring payments and never miss a bill.</p>
            <Button asChild className="w-full">
              <Link href="/subscriptions/active">View Subscriptions</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Value Analysis</CardTitle>
            <CardDescription>Analyze the ROI of your subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">See which subscriptions provide the most value.</p>
            <Button asChild className="w-full">
              <Link href="/subscriptions/roi-calculator">View Analysis</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Duplicate Detection</CardTitle>
            <CardDescription>Find overlapping services</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Identify potential duplicate subscriptions and save money.</p>
            <Button asChild className="w-full">
              <Link href="/subscriptions/duplicates">Check Duplicates</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

