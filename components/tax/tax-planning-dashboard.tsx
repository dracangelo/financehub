"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, PiggyBank, TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2, PlusCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import Link from "next/link"

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
  is_completed: boolean
}

interface TaxImpactPrediction {
  id: string
  scenario: string
  current_tax_burden: number
  predicted_tax_burden: number
  difference: number
}

interface TaxProfessional {
  id: string
  name: string
  firm: string
  specialties: string[]
}

interface TaxSummary {
  totalDeductions: number
  totalPotentialSavings: number
  pendingDocuments: number
  upcomingDeadlines: number
}

export function TaxPlanningDashboard() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [categories, setCategories] = useState<TaxCategory[]>([])
  const [deductions, setDeductions] = useState<TaxDeduction[]>([])
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [recommendations, setRecommendations] = useState<TaxRecommendation[]>([])
  const [timeline, setTimeline] = useState<TaxTimelineItem[]>([])
  const [predictions, setPredictions] = useState<TaxImpactPrediction[]>([])
  const [professionals, setProfessionals] = useState<TaxProfessional[]>([])
  const [summary, setSummary] = useState<TaxSummary>({
    totalDeductions: 0,
    totalPotentialSavings: 0,
    pendingDocuments: 0,
    upcomingDeadlines: 0
  })

  useEffect(() => {
    async function fetchTaxData() {
      try {
        setLoading(true)
        
        // Fetch all tax data from the main tax API endpoint
        const response = await fetch('/api/tax')
        if (!response.ok) {
          throw new Error('Failed to fetch tax data')
        }
        
        const data = await response.json()
        
        // Set all the data from the API response
        setCategories(data.categories || [])
        setDeductions(data.deductions || [])
        setDocuments(data.documents || [])
        setRecommendations(data.recommendations || [])
        setTimeline(data.timeline || [])
        setPredictions(data.predictions || [])
        setProfessionals(data.professionals || [])
        setSummary(data.summary || {
          totalDeductions: 0,
          totalPotentialSavings: 0,
          pendingDocuments: 0,
          upcomingDeadlines: 0
        })
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching tax data:", error)
        setLoading(false)
      }
    }

    fetchTaxData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading tax data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tax Planning Dashboard</h1>
        <Link href="/tax-planner/add">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Tax Data
          </Button>
        </Link>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalDeductions)}</div>
            <p className="text-xs text-muted-foreground">Current tax year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalPotentialSavings)}</div>
            <p className="text-xs text-muted-foreground">From recommendations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingDocuments}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">In the next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tax Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Recommendations</CardTitle>
                <CardDescription>Actionable suggestions to optimize your taxes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.slice(0, 3).map((rec) => (
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
                        {rec.potential_savings && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            Potential savings: {formatCurrency(rec.potential_savings)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
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
                  {timeline.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                      <div className="mt-1">
                        {item.is_completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge variant={item.is_completed ? "default" : "outline"}>
                            {item.is_completed ? "Completed" : formatDate(item.due_date)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">View Full Timeline</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Impact Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Impact Predictions</CardTitle>
              <CardDescription>See how financial decisions affect your tax burden</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.slice(0, 2).map((pred) => (
                  <div key={pred.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{pred.scenario}</h4>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Tax Burden</p>
                        <p className="font-medium">{formatCurrency(pred.current_tax_burden)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Predicted Tax Burden</p>
                        <p className="font-medium">{formatCurrency(pred.predicted_tax_burden)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Difference</p>
                        <p className={`font-medium ${pred.difference < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(pred.difference)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">View All Predictions</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Tax Recommendations</CardTitle>
              <CardDescription>Actionable suggestions to optimize your taxes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="flex items-start space-x-4 p-4 border rounded-lg">
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
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      {rec.potential_savings && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          Potential savings: {formatCurrency(rec.potential_savings)}
                        </p>
                      )}
                      {rec.action_items && rec.action_items.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Action Items:</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {rec.action_items.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {rec.deadline && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Deadline: {formatDate(rec.deadline)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Tax Timeline</CardTitle>
              <CardDescription>Important tax dates and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="mt-1">
                      {item.is_completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant={item.is_completed ? "default" : "outline"}>
                          {item.is_completed ? "Completed" : formatDate(item.due_date)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Tax Documents</CardTitle>
              <CardDescription>Organize and track your tax documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="mt-1">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{doc.name}</h4>
                        <Badge variant={
                          doc.status === "pending" ? "outline" : 
                          doc.status === "received" ? "default" : 
                          doc.status === "processed" ? "secondary" : "default"
                        }>
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{doc.type}</Badge>
                        {doc.categories && (
                          <Badge variant="outline" style={{ backgroundColor: doc.categories.color + '20', color: doc.categories.color }}>
                            {doc.categories.name}
                          </Badge>
                        )}
                      </div>
                      {doc.due_date && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Due: {formatDate(doc.due_date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Tax Impact Predictions</CardTitle>
              <CardDescription>See how financial decisions affect your tax burden</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((pred) => (
                  <div key={pred.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{pred.scenario}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Tax Burden</p>
                        <p className="font-medium">{formatCurrency(pred.current_tax_burden)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Predicted Tax Burden</p>
                        <p className="font-medium">{formatCurrency(pred.predicted_tax_burden)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Difference</p>
                        <p className={`font-medium ${pred.difference < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(pred.difference)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Mock data for demonstration
const mockDeductions: TaxDeduction[] = [
  {
    id: "1",
    name: "Mortgage Interest",
    amount: 8500,
    max_amount: 10000,
    categories: { id: "1", name: "Housing", type: "deduction", color: "#3b82f6" }
  },
  {
    id: "2",
    name: "Charitable Contributions",
    amount: 2500,
    max_amount: 60000,
    categories: { id: "2", name: "Charity", type: "deduction", color: "#10b981" }
  },
  {
    id: "3",
    name: "State and Local Taxes",
    amount: 1500,
    max_amount: 10000,
    categories: { id: "3", name: "Taxes", type: "deduction", color: "#f59e0b" }
  }
]

const mockDocuments: TaxDocument[] = [
  {
    id: "1",
    name: "W-2 Form",
    type: "w2",
    status: "received",
    due_date: "2023-01-31",
    categories: { id: "4", name: "Income", type: "income", color: "#6366f1" }
  },
  {
    id: "2",
    name: "1099-INT",
    type: "1099",
    status: "pending",
    due_date: "2023-01-31",
    categories: { id: "5", name: "Investment", type: "income", color: "#8b5cf6" }
  },
  {
    id: "3",
    name: "Property Tax Receipt",
    type: "receipt",
    status: "processed",
    due_date: "2023-04-15",
    categories: { id: "3", name: "Taxes", type: "deduction", color: "#f59e0b" }
  }
]

const mockRecommendations: TaxRecommendation[] = [
  {
    id: "1",
    type: "optimization",
    priority: "high",
    title: "Maximize Retirement Contributions",
    description: "Increase your 401(k) contributions to reduce taxable income.",
    potential_savings: 1200,
    action_items: ["Log into your employer portal", "Increase contribution percentage by 2%"],
    deadline: "2023-12-31",
    is_completed: false
  },
  {
    id: "2",
    type: "deduction",
    priority: "urgent",
    title: "Track Home Office Expenses",
    description: "You may be eligible for home office deductions if you work remotely.",
    potential_savings: 800,
    action_items: ["Measure your home office space", "Keep receipts for office supplies"],
    deadline: "2023-12-31",
    is_completed: false
  },
  {
    id: "3",
    type: "investment",
    priority: "medium",
    title: "Consider Tax-Loss Harvesting",
    description: "Sell investments at a loss to offset capital gains.",
    potential_savings: 1500,
    action_items: ["Review your investment portfolio", "Identify underperforming investments"],
    deadline: "2023-12-31",
    is_completed: false
  }
]

const mockTimeline: TaxTimelineItem[] = [
  {
    id: "1",
    title: "File Quarterly Estimated Taxes",
    description: "Due date for Q3 estimated tax payments",
    due_date: "2023-09-15",
    is_completed: true
  },
  {
    id: "2",
    title: "Gather Tax Documents",
    description: "Start collecting W-2s, 1099s, and other tax documents",
    due_date: "2023-12-31",
    is_completed: false
  },
  {
    id: "3",
    title: "File Annual Tax Return",
    description: "Deadline for filing your annual tax return",
    due_date: "2024-04-15",
    is_completed: false
  }
]

const mockPredictions: TaxImpactPrediction[] = [
  {
    id: "1",
    scenario: "Increasing 401(k) Contributions",
    current_tax_burden: 15000,
    predicted_tax_burden: 13800,
    difference: -1200
  },
  {
    id: "2",
    scenario: "Starting a Side Business",
    current_tax_burden: 15000,
    predicted_tax_burden: 16500,
    difference: 1500
  }
]

const mockProfessionals: TaxProfessional[] = [
  {
    id: "1",
    name: "John Smith",
    firm: "Tax Experts LLC",
    specialties: ["Small Business", "Real Estate"]
  },
  {
    id: "2",
    name: "Sarah Johnson",
    firm: "Personal Tax Advisors",
    specialties: ["High Net Worth", "International Tax"]
  }
] 