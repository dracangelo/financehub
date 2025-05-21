"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, RefreshCw, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Subscription } from "@/types/subscription"

export const metadata: Metadata = {
  title: "Duplicate Service Detection",
  description: "Find overlapping subscriptions and reduce unnecessary costs",
}

export const dynamic = "force-dynamic"

interface OverlappingProvider {
  service_provider: string
  subscriptions: {
    id: string
    name: string
    start_date: string
    end_date: string | null
  }[]
  count: number
}

export default function DuplicatesPage() {
  const router = useRouter()
  
  // State
  const [overlappingProviders, setOverlappingProviders] = useState<OverlappingProvider[]>([])
  const [loading, setLoading] = useState(true)
  
  // Fetch overlapping subscriptions
  const fetchOverlappingSubscriptions = async () => {
    try {
      setLoading(true)
      
      const response = await fetch("/api/subscriptions/overlap")
      
      if (!response.ok) {
        throw new Error("Failed to fetch overlapping subscriptions")
      }
      
      const data = await response.json()
      setOverlappingProviders(data)
    } catch (error) {
      console.error("Error fetching overlapping subscriptions:", error)
      toast.error("Failed to load duplicate subscriptions")
    } finally {
      setLoading(false)
    }
  }
  
  // Initial fetch
  useEffect(() => {
    fetchOverlappingSubscriptions()
  }, [])
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  // Calculate overlap status
  const getOverlapStatus = (sub1: any, sub2: any) => {
    const start1 = new Date(sub1.start_date)
    const end1 = sub1.end_date ? new Date(sub1.end_date) : null
    const start2 = new Date(sub2.start_date)
    const end2 = sub2.end_date ? new Date(sub2.end_date) : null
    
    // Both ongoing (no end date)
    if (!end1 && !end2) {
      return "Both subscriptions are ongoing with no end date"
    }
    
    // One ongoing, one with end date
    if (!end1 && end2) {
      if (start1 <= end2) {
        return "Overlapping: First subscription continues beyond second subscription's end date"
      } else {
        return "No overlap: First subscription starts after second subscription ends"
      }
    }
    
    if (end1 && !end2) {
      if (start2 <= end1) {
        return "Overlapping: Second subscription continues beyond first subscription's end date"
      } else {
        return "No overlap: Second subscription starts after first subscription ends"
      }
    }
    
    // Both have end dates
    if (end1 && end2) {
      if (start1 <= end2 && start2 <= end1) {
        return "Overlapping: Subscription periods intersect"
      } else {
        return "No overlap: Subscription periods do not intersect"
      }
    }
    
    return "Unable to determine overlap status"
  }
  
  // Calculate total potential savings
  const calculatePotentialSavings = () => {
    let totalDuplicates = 0
    
    overlappingProviders.forEach(provider => {
      totalDuplicates += provider.count - 1 // Count all but one subscription as duplicates
    })
    
    return totalDuplicates
  }
  
  // Render skeletons during loading
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    ))
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Duplicate Detection</h1>
          <p className="text-muted-foreground">
            Find and manage overlapping subscription services
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchOverlappingSubscriptions}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          
          <Button
            onClick={() => router.push("/subscriptions/active")}
            className="flex items-center gap-2"
          >
            Manage Subscriptions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Subscription Analysis</CardTitle>
          <CardDescription>
            We've analyzed your subscriptions to find potential duplicates and overlapping services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : overlappingProviders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Duplicates Found</AlertTitle>
              <AlertDescription>
                Great job! We didn't find any duplicate or overlapping subscriptions.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Potential Duplicates Detected</AlertTitle>
              <AlertDescription>
                We found {overlappingProviders.length} service provider{overlappingProviders.length !== 1 ? 's' : ''} with multiple subscriptions,
                totaling {calculatePotentialSavings()} potential duplicate{calculatePotentialSavings() !== 1 ? 's' : ''}.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Duplicates List */}
      {!loading && overlappingProviders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Detected Duplicates</h2>
          
          <Accordion type="single" collapsible className="w-full">
            {overlappingProviders.map((provider, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="font-medium">{provider.service_provider}</span>
                    <span className="text-sm text-muted-foreground">
                      ({provider.count} subscriptions)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Subscription Details</CardTitle>
                      <CardDescription>
                        You have multiple subscriptions for {provider.service_provider}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {provider.subscriptions.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell className="font-medium">{sub.name}</TableCell>
                              <TableCell>{formatDate(sub.start_date)}</TableCell>
                              <TableCell>{sub.end_date ? formatDate(sub.end_date) : "Ongoing"}</TableCell>
                              <TableCell>
                                <span className="inline-flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                Active
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start">
                      <h4 className="font-medium mb-2">Overlap Analysis</h4>
                      <div className="space-y-2 w-full">
                        {provider.subscriptions.length > 1 && provider.subscriptions.slice(0, -1).map((sub1, i) => 
                          provider.subscriptions.slice(i + 1).map((sub2, j) => (
                            <Alert key={`${i}-${j}`} variant="destructive" className="py-2">
                              <div className="flex flex-col space-y-1">
                                <div className="font-medium">
                                  {sub1.name} + {sub2.name}
                                </div>
                                <div className="text-sm">
                                  {getOverlapStatus(sub1, sub2)}
                                </div>
                              </div>
                            </Alert>
                          ))
                        ).flat()}
                      </div>
                      
                      <div className="w-full mt-4">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => router.push("/subscriptions/active")}
                        >
                          Manage These Subscriptions
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
      
      {/* Recommendations */}
      {!loading && overlappingProviders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Tips to optimize your subscription spending
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="bg-amber-100 text-amber-800 rounded-full p-1 mt-0.5">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">Review Overlapping Subscriptions</h3>
                <p className="text-sm text-muted-foreground">
                  Consider if you need multiple subscriptions from the same provider. You might be able to consolidate
                  to a single plan or find a better deal.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="bg-amber-100 text-amber-800 rounded-full p-1 mt-0.5">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">Check for Bundle Opportunities</h3>
                <p className="text-sm text-muted-foreground">
                  Some providers offer bundle discounts when combining multiple services. This could save you money
                  compared to separate subscriptions.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="bg-amber-100 text-amber-800 rounded-full p-1 mt-0.5">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">Consider Family or Group Plans</h3>
                <p className="text-sm text-muted-foreground">
                  If you have multiple individual subscriptions, check if a family or group plan would be more cost-effective.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
