"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, PiggyBank, TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface TaxCategory {
  id: string
  name: string
  type: string
  color: string
}

interface TaxDeduction {
  id: string
  name: string
  amount: number
  max_amount: number
  categories: TaxCategory
}

interface TaxDocument {
  id: string
  name: string
  type: string
  status: string
  due_date: string
  categories: TaxCategory
}

interface TaxRecommendation {
  id: string
  type: string
  priority: string
  title: string
  description: string
  potential_savings: number
  action_items: string[]
  deadline: string
  is_completed: boolean
}

interface TaxTimelineItem {
  id: string
  title: string
  description: string
  due_date: string
  type: string
  is_completed: boolean
  is_recurring?: boolean
  recurrence_pattern?: string
}

interface TaxImpactPrediction {
  id: string
  scenario: string
  current_tax_burden: number
  predicted_tax_burden: number
  difference: number
}

interface TaxSummary {
  totalDeductions: number
  totalPotentialSavings: number
  pendingDocuments: number
  upcomingDeadlines: number
}

// In a real application, this data would come from an API call

export function TaxPlanningDashboard() {
  const [loading, setLoading] = useState(true)
  const [deductions, setDeductions] = useState<TaxDeduction[]>([])
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [recommendations, setRecommendations] = useState<TaxRecommendation[]>([])
  const [timeline, setTimeline] = useState<TaxTimelineItem[]>([])
  const [predictions, setPredictions] = useState<TaxImpactPrediction[]>([])
  const [summary, setSummary] = useState<TaxSummary>({
    totalDeductions: 0,
    totalPotentialSavings: 0,
    pendingDocuments: 0,
    upcomingDeadlines: 0
  })
  
  // Simulate loading state for demonstration
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // In a real application, you would fetch data from an API here
  // For example:
  // useEffect(() => {
  //   const fetchTaxData = async () => {
  //     setLoading(true);
  //     try {
  //       const data = await fetchFromApi('/api/tax-data');
  //       setDeductions(data.deductions);
  //       setDocuments(data.documents);
  //       setRecommendations(data.recommendations);
  //       setTimeline(data.timeline);
  //       setPredictions(data.predictions);
  //       setSummary(data.summary);
  //     } catch (error) {
  //       console.error('Error fetching tax data:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchTaxData();
  // }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading tax data...</p>
        </div>
      </div>
    )
  }
  
  // Calculate upcoming deadlines
  const upcomingDeadlines = timeline
    .filter(item => !item.is_completed && new Date(item.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Deductions</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalDeductions)}</p>
              </div>
              <PiggyBank className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Potential Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalPotentialSavings)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Pending Documents</p>
                <p className="text-2xl font-bold">{summary.pendingDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Upcoming Deadlines</p>
                <p className="text-2xl font-bold">{summary.upcomingDeadlines}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">In the next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tax Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Recommendations</CardTitle>
              <CardDescription>Actionable suggestions to optimize your taxes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.slice(0, 2).map((rec) => (
                    <div key={rec.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                      <div className="mt-1">
                        {rec.priority === "urgent" ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge variant={rec.priority === "urgent" ? "destructive" : "default"}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        {rec.potential_savings > 0 && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            Potential savings: {formatCurrency(rec.potential_savings)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No tax recommendations available</p>
                  </div>
                )}
                <Button variant="outline" className="w-full">View All Recommendations</Button>
              </div>
            </CardContent>
          </Card>

          {/* Tax Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Timeline</CardTitle>
              <CardDescription>Upcoming tax deadlines and important dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                      <div className="mt-1">
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge variant="outline">
                            {formatDate(item.due_date)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No upcoming tax deadlines</p>
                  </div>
                )}
                <Button variant="outline" className="w-full">View Full Timeline</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tax Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Documents</CardTitle>
              <CardDescription>Recent and pending tax documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                      <div className="mt-1">
                        <FileText className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{doc.name}</h4>
                          <Badge variant={doc.status === "pending" ? "outline" : "secondary"}>
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Type: {doc.type}</p>
                        {doc.due_date && (
                          <p className="text-sm text-muted-foreground">
                            Due: {formatDate(doc.due_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No tax documents available</p>
                  </div>
                )}
                <Button variant="outline" className="w-full">Manage Documents</Button>
              </div>
            </CardContent>
          </Card>

          {/* Tax Deductions */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Deductions</CardTitle>
              <CardDescription>Track your tax deductions and credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deductions.length > 0 ? (
                  deductions.map((deduction) => (
                    <div key={deduction.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{deduction.name}</h4>
                        <Badge
                          style={{ backgroundColor: deduction.categories?.color }}
                        >
                          {deduction.categories?.name}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{formatCurrency(deduction.amount)}</span>
                          <span>{Math.round((deduction.amount / deduction.max_amount) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${Math.min(100, (deduction.amount / deduction.max_amount) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(deduction.amount)} of {formatCurrency(deduction.max_amount)} maximum
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No tax deductions available</p>
                  </div>
                )}
                <Button variant="outline" className="w-full">View All Deductions</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
