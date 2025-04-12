import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, BarChart3Icon, PieChartIcon, TrendingUpIcon } from "lucide-react"
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"
import { getClientSupabaseClient } from "@/lib/supabase/client"
import { getClientAuthenticatedUser } from "@/lib/auth"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

interface Subscription {
  id: string
  name: string
  category: string
  cost: number
  usage: number
  value: number
  billing_cycle: string
  next_billing_date: string
}

interface ROIAnalysis {
  subscription: Subscription
  monthlyCost: number
  costPerUse: number
  valueScore: number
  roiPercentage: number
  recommendation: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function SubscriptionROICalculator() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [roiAnalysis, setRoiAnalysis] = useState<ROIAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [totalMonthlyCost, setTotalMonthlyCost] = useState(0)
  const [totalValueScore, setTotalValueScore] = useState(0)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await getClientAuthenticatedUser()
      if (!user) {
        throw new Error("Not authenticated")
      }

      const supabase = getClientSupabaseClient()
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("cost", { ascending: false })

      if (error) throw error

      // Calculate ROI analysis for each subscription
      const analysis = subscriptions.map(sub => calculateROIAnalysis(sub))
      setSubscriptions(subscriptions)
      setRoiAnalysis(analysis)

      // Calculate totals
      const totalCost = subscriptions.reduce((sum, sub) => {
        const monthlyCost = sub.billing_cycle === "monthly" ? sub.cost :
          sub.billing_cycle === "quarterly" ? sub.cost / 3 :
          sub.billing_cycle === "annually" ? sub.cost / 12 : sub.cost
        return sum + monthlyCost
      }, 0)

      const totalValue = analysis.reduce((sum, a) => sum + a.valueScore, 0)
      const avgValue = totalValue / analysis.length

      setTotalMonthlyCost(totalCost)
      setTotalValueScore(avgValue)
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateROIAnalysis = (sub: Subscription): ROIAnalysis => {
    // Calculate monthly cost based on billing cycle
    let monthlyCost = sub.cost
    if (sub.billing_cycle === 'yearly') {
      monthlyCost = sub.cost / 12
    } else if (sub.billing_cycle === 'quarterly') {
      monthlyCost = sub.cost / 3
    } else if (sub.billing_cycle === 'bi-annual') {
      monthlyCost = sub.cost / 6
    }
    
    // Calculate cost per use (assuming usage is a percentage of optimal usage)
    const costPerUse = sub.usage > 0 
      ? monthlyCost / (sub.usage / 100) 
      : monthlyCost
    
    // Calculate value score (0-100)
    const valueScore = Math.round((sub.value / 100) * 100)
    
    // Calculate ROI percentage
    const roiPercentage = sub.usage > 0 
      ? Math.round((sub.value / sub.usage) * 100) 
      : 0
    
    // Generate recommendation
    let recommendation = ""
    if (sub.usage < 30 && sub.cost > 10) {
      recommendation = "Consider cancelling or downgrading this subscription due to low usage."
    } else if (sub.usage < 50 && sub.cost > 20) {
      recommendation = "Evaluate if this subscription is still necessary or if a lower tier would suffice."
    } else if (sub.value > 80 && sub.cost > 20) {
      recommendation = "This is a high-value subscription. Consider annual plans for potential savings."
    } else if (roiPercentage < 50) {
      recommendation = "The return on investment is low. Consider alternatives or optimizing usage."
    } else {
      recommendation = "This subscription provides good value for your usage."
    }
    
    return {
      subscription: sub,
      monthlyCost,
      costPerUse,
      valueScore,
      roiPercentage,
      recommendation
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getValueColor = (value: number) => {
    if (value >= 80) return "text-green-600"
    if (value >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getROIColor = (roi: number) => {
    if (roi >= 150) return "text-green-600"
    if (roi >= 100) return "text-yellow-600"
    return "text-red-600"
  }

  // Prepare data for charts
  const valueVsCostData = roiAnalysis.map(item => ({
    name: item.subscription.name,
    value: item.valueScore,
    cost: item.monthlyCost,
    roi: item.roiPercentage
  }))

  const categoryData = roiAnalysis.reduce((acc: any[], item) => {
    const existingCategory = acc.find(cat => cat.name === item.subscription.category)
    
    if (existingCategory) {
      existingCategory.value += item.monthlyCost
    } else {
      acc.push({
        name: item.subscription.category,
        value: item.monthlyCost
      })
    }
    
    return acc
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3Icon className="h-5 w-5 text-blue-500" />
          Subscription ROI Calculator
        </CardTitle>
        <CardDescription>
          Analyze the value and return on investment of your subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Total Monthly Cost</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalMonthlyCost)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Average Value Score</div>
                  <div className="text-2xl font-bold">{totalValueScore.toFixed(1)}/100</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Subscriptions</div>
                  <div className="text-2xl font-bold">{subscriptions.length}</div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="overview" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                {roiAnalysis.length === 0 ? (
                  <Alert>
                    <InfoIcon className="h-5 w-5" />
                    <AlertTitle>No subscriptions found</AlertTitle>
                    <AlertDescription>
                      Add subscriptions to see ROI analysis and recommendations.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {roiAnalysis.map((analysis, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="p-4 border-b">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{analysis.subscription.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {analysis.subscription.category} • {analysis.subscription.billing_cycle}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(analysis.monthlyCost)}/mo</div>
                              <div className={`text-sm ${getValueColor(analysis.valueScore)}`}>
                                Value: {analysis.valueScore}/100
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted/30">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Usage</div>
                              <div className="font-medium">{analysis.subscription.usage}%</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">ROI</div>
                              <div className={`font-medium ${getROIColor(analysis.roiPercentage)}`}>
                                {analysis.roiPercentage}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <div className="font-medium mb-1">Recommendation:</div>
                            <p>{analysis.recommendation}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="analysis" className="space-y-4">
                {roiAnalysis.length === 0 ? (
                  <Alert>
                    <InfoIcon className="h-5 w-5" />
                    <AlertTitle>No subscriptions found</AlertTitle>
                    <AlertDescription>
                      Add subscriptions to see detailed ROI analysis.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Subscription</th>
                          <th className="text-right py-2 px-4">Monthly Cost</th>
                          <th className="text-right py-2 px-4">Usage %</th>
                          <th className="text-right py-2 px-4">Value Score</th>
                          <th className="text-right py-2 px-4">ROI %</th>
                          <th className="text-right py-2 px-4">Cost/Use</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roiAnalysis.map((analysis, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-4">{analysis.subscription.name}</td>
                            <td className="text-right py-2 px-4">{formatCurrency(analysis.monthlyCost)}</td>
                            <td className="text-right py-2 px-4">{analysis.subscription.usage}%</td>
                            <td className={`text-right py-2 px-4 ${getValueColor(analysis.valueScore)}`}>
                              {analysis.valueScore}
                            </td>
                            <td className={`text-right py-2 px-4 ${getROIColor(analysis.roiPercentage)}`}>
                              {analysis.roiPercentage}%
                            </td>
                            <td className="text-right py-2 px-4">{formatCurrency(analysis.costPerUse)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="charts" className="space-y-6">
                {roiAnalysis.length === 0 ? (
                  <Alert>
                    <InfoIcon className="h-5 w-5" />
                    <AlertTitle>No subscriptions found</AlertTitle>
                    <AlertDescription>
                      Add subscriptions to see visualizations.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="h-80">
                      <h3 className="text-lg font-medium mb-4">Value vs. Cost</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={valueVsCostData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="value" name="Value Score" fill="#8884d8" />
                          <Bar yAxisId="right" dataKey="cost" name="Monthly Cost" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="h-80">
                      <h3 className="text-lg font-medium mb-4">Cost by Category</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
} 