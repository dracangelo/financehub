import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, TrendingDownIcon, AlertTriangleIcon, CheckCircleIcon } from "lucide-react"
import { supabaseClient } from "@/lib/supabase"

interface NegotiationSuggestion {
  id: string
  type: "bill" | "subscription"
  name: string
  currentCost: number
  potentialSavings: number
  confidence: number
  reasoning: string
  actionItems: string[]
  category: string
}

export function BillNegotiationAssistant() {
  const [suggestions, setSuggestions] = useState<NegotiationSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [totalPotentialSavings, setTotalPotentialSavings] = useState(0)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      
      // Fetch bills and subscriptions from Supabase
      const { data: bills, error: billsError } = await supabaseClient
        .from('bills')
        .select('*')
        .eq('is_recurring', true)
      
      if (billsError) throw billsError
      
      const { data: subscriptions, error: subsError } = await supabaseClient
        .from('subscriptions')
        .select('*')
      
      if (subsError) throw subsError
      
      // Generate negotiation suggestions based on the data
      const generatedSuggestions = generateSuggestions(bills || [], subscriptions || [])
      setSuggestions(generatedSuggestions)
      
      // Calculate total potential savings
      const totalSavings = generatedSuggestions.reduce(
        (sum, suggestion) => sum + suggestion.potentialSavings, 
        0
      )
      setTotalPotentialSavings(totalSavings)
      
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateSuggestions = (bills: any[], subscriptions: any[]): NegotiationSuggestion[] => {
    const suggestions: NegotiationSuggestion[] = []
    
    // Analyze bills for negotiation opportunities
    bills.forEach(bill => {
      // Check for high utility bills that could be negotiated
      if (bill.category === "utilities" && bill.amount > 100) {
        suggestions.push({
          id: `bill-${bill.id}`,
          type: "bill",
          name: bill.name,
          currentCost: bill.amount,
          potentialSavings: bill.amount * 0.1, // Estimate 10% savings
          confidence: 0.7,
          reasoning: "Utility companies often have retention departments that can offer discounts to prevent customers from switching providers.",
          actionItems: [
            "Call the utility company and ask to speak with the retention department",
            "Research competitor rates before calling",
            "Mention that you're considering switching providers",
            "Ask about any loyalty programs or discounts for long-term customers"
          ],
          category: "utilities"
        })
      }
      
      // Check for insurance bills that could be renegotiated
      if (bill.category === "insurance" && bill.amount > 50) {
        suggestions.push({
          id: `bill-${bill.id}`,
          type: "bill",
          name: bill.name,
          currentCost: bill.amount,
          potentialSavings: bill.amount * 0.15, // Estimate 15% savings
          confidence: 0.8,
          reasoning: "Insurance rates can often be negotiated, especially if you've been a customer for a long time or have multiple policies with the same provider.",
          actionItems: [
            "Review your current coverage to ensure it's still appropriate",
            "Get quotes from competing insurance providers",
            "Call your current provider and ask about discounts",
            "Inquire about bundling multiple policies for additional savings"
          ],
          category: "insurance"
        })
      }
    })
    
    // Analyze subscriptions for optimization opportunities
    subscriptions.forEach(subscription => {
      // Check for low usage subscriptions
      if (subscription.usage < 30 && subscription.cost > 10) {
        suggestions.push({
          id: `sub-${subscription.id}`,
          type: "subscription",
          name: subscription.name,
          currentCost: subscription.cost,
          potentialSavings: subscription.cost,
          confidence: 0.9,
          reasoning: "This subscription has low usage (${subscription.usage}%) but significant cost. Consider cancelling or downgrading to a lower tier.",
          actionItems: [
            "Review your actual usage of this service",
            "Check if there's a lower tier plan available",
            "Consider cancelling if the service isn't essential",
            "Look for alternative services with better value"
          ],
          category: subscription.category
        })
      }
      
      // Check for high-value subscriptions that could be optimized
      if (subscription.value > 80 && subscription.cost > 20) {
        suggestions.push({
          id: `sub-${subscription.id}`,
          type: "subscription",
          name: subscription.name,
          currentCost: subscription.cost,
          potentialSavings: subscription.cost * 0.2, // Estimate 20% savings
          confidence: 0.6,
          reasoning: "This is a high-value subscription that you use frequently. There may be annual plans or family plans available at a discount.",
          actionItems: [
            "Check if an annual plan is available at a discount",
            "Look for family or team plans if applicable",
            "Search for promotional codes or special offers",
            "Contact customer service to ask about loyalty discounts"
          ],
          category: subscription.category
        })
      }
    })
    
    return suggestions
  }

  const filteredSuggestions = activeTab === "all" 
    ? suggestions 
    : suggestions.filter(s => s.type === activeTab)

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800"
    if (confidence >= 0.5) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDownIcon className="h-5 w-5 text-green-500" />
          Bill Negotiation Assistant
        </CardTitle>
        <CardDescription>
          Discover opportunities to lower your recurring costs and save money
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <AlertTitle>Potential Savings</AlertTitle>
                <AlertDescription>
                  We've identified opportunities to save <span className="font-bold text-green-600">{formatCurrency(totalPotentialSavings)}</span> on your recurring expenses.
                </AlertDescription>
              </Alert>
            </div>
            
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Suggestions</TabsTrigger>
                <TabsTrigger value="bill">Bills</TabsTrigger>
                <TabsTrigger value="subscription">Subscriptions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {filteredSuggestions.length === 0 ? (
                  <Alert>
                    <InfoIcon className="h-5 w-5" />
                    <AlertTitle>No suggestions found</AlertTitle>
                    <AlertDescription>
                      We couldn't find any opportunities for savings at this time. Check back later or add more bills and subscriptions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  filteredSuggestions.map(suggestion => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="bill" className="space-y-4">
                {filteredSuggestions.length === 0 ? (
                  <Alert>
                    <InfoIcon className="h-5 w-5" />
                    <AlertTitle>No bill suggestions found</AlertTitle>
                    <AlertDescription>
                      We couldn't find any opportunities for savings on your bills at this time.
                    </AlertDescription>
                  </Alert>
                ) : (
                  filteredSuggestions.map(suggestion => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="subscription" className="space-y-4">
                {filteredSuggestions.length === 0 ? (
                  <Alert>
                    <InfoIcon className="h-5 w-5" />
                    <AlertTitle>No subscription suggestions found</AlertTitle>
                    <AlertDescription>
                      We couldn't find any opportunities for savings on your subscriptions at this time.
                    </AlertDescription>
                  </Alert>
                ) : (
                  filteredSuggestions.map(suggestion => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function SuggestionCard({ suggestion }: { suggestion: NegotiationSuggestion }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800"
    if (confidence >= 0.5) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }
  
  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High confidence"
    if (confidence >= 0.5) return "Medium confidence"
    return "Low confidence"
  }
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{suggestion.name}</h3>
            <p className="text-sm text-muted-foreground">
              Current cost: <span className="font-medium">{formatCurrency(suggestion.currentCost)}</span>
            </p>
          </div>
          <Badge variant="outline" className={getConfidenceColor(suggestion.confidence)}>
            {getConfidenceText(suggestion.confidence)}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 bg-muted/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Potential Savings:</span>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(suggestion.potentialSavings)}
          </span>
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          {suggestion.reasoning}
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recommended Actions:</h4>
          <ul className="text-sm space-y-1">
            {suggestion.actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Dismiss
        </Button>
        <Button size="sm">
          Take Action
        </Button>
      </div>
    </Card>
  )
} 