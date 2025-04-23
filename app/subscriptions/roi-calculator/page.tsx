import type { Metadata } from "next"
import { getSubscriptionROI } from "@/app/actions/subscriptions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Subscription ROI Calculator",
  description: "Analyze the value of your subscriptions based on usage and cost",
}

// Define the subscription type for the component props
type SubscriptionData = {
  id: string;
  name: string;
  provider: string;
  monthlyAmount: number;
  valueCategory: string;
  roiScore: number;
  usageScore: number;
  usageHours: number;
  costPerUse: number;
  costPerHour: number;
  recommendation: string;
}

// Simple component to display subscription ROI in a matrix
function SubscriptionValueMatrix({ subscriptions }: { subscriptions: SubscriptionData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Value Matrix</CardTitle>
        <CardDescription>Visualize your subscriptions by usage and cost</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full p-4">
            <div className="border-b border-l h-full relative">
              {/* Y-axis label */}
              <div className="absolute -left-10 top-1/2 -rotate-90 transform origin-center text-sm text-muted-foreground">
                Usage Frequency →
              </div>
              
              {/* X-axis label */}
              <div className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground">
                Cost →
              </div>
              
              {/* Plot points */}
              {subscriptions.map((sub) => {
                // Calculate position based on usage score (y) and cost (x)
                const xPos = Math.min(95, Math.max(5, 100 - (sub.roiScore))) + '%';
                const yPos = Math.min(95, Math.max(5, 100 - (sub.usageScore * 10))) + '%';
                
                // Determine color based on value category
                const bgColor = 
                  sub.valueCategory === 'good' ? 'bg-green-500' : 
                  sub.valueCategory === 'average' ? 'bg-amber-500' : 'bg-red-500';
                
                return (
                  <div 
                    key={sub.id}
                    className={`absolute w-4 h-4 rounded-full ${bgColor} transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
                    style={{ left: xPos, bottom: yPos }}
                    title={`${sub.name}: $${sub.monthlyAmount}/month`}
                  />
                );
              })}
              
              {/* Quadrant labels */}
              <div className="absolute top-4 left-4 text-xs text-muted-foreground">Low Cost, High Usage</div>
              <div className="absolute top-4 right-4 text-xs text-muted-foreground">High Cost, High Usage</div>
              <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">Low Cost, Low Usage</div>
              <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">High Cost, Low Usage</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple component to display subscription ROI in a list
function SubscriptionROIList({ subscriptions }: { subscriptions: SubscriptionData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription ROI Analysis</CardTitle>
        <CardDescription>Detailed breakdown of each subscription's value</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {subscriptions.sort((a, b) => b.roiScore - a.roiScore).map((sub) => (
            <div key={sub.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{sub.name}</h3>
                  <p className="text-sm text-muted-foreground">{sub.provider}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  sub.valueCategory === 'good' ? 'bg-green-100 text-green-800' : 
                  sub.valueCategory === 'average' ? 'bg-amber-100 text-amber-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {sub.valueCategory === 'good' ? 'Good Value' : 
                   sub.valueCategory === 'average' ? 'Average Value' : 'Poor Value'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Cost</p>
                  <p className="font-medium">${sub.monthlyAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROI Score</p>
                  <p className="font-medium">{sub.roiScore.toFixed(0)}/100</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usage</p>
                  <p className="font-medium">{sub.usageHours.toFixed(1)} hrs/month</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost Per Hour</p>
                  <p className="font-medium">${sub.costPerHour.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-4 bg-muted p-3 rounded-md text-sm">
                <p><span className="font-medium">Recommendation:</span> {sub.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function SubscriptionROIPage() {
  try {
    // Fetch subscription ROI data
    const subscriptionData = await getSubscriptionROI();
    
    // Handle empty data case
    if (!subscriptionData || !Array.isArray(subscriptionData) || subscriptionData.length === 0) {
      return (
        <div className="container mx-auto py-6 space-y-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Subscription ROI Calculator</h1>
            <p className="text-muted-foreground">Analyze the value of your subscriptions based on usage and cost</p>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Subscription Data Found</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Add subscriptions and track your usage to see ROI analysis and value recommendations.
              </p>
              <Button asChild>
                <Link href="/subscriptions">Manage Subscriptions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Process the data for our components
    const subscriptionsWithROI = subscriptionData.map(item => ({
      id: item.id || (item as any).subscriptionId || `sub-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || 'Unnamed Subscription',
      provider: item.provider || '',
      monthlyAmount: item.monthlyAmount || 0,
      valueCategory: item.valueCategory || 'average',
      roiScore: item.roiScore || 50,
      usageScore: item.usageScore || 5,
      usageHours: item.usageHours || 0,
      costPerUse: item.costPerUse || 0,
      costPerHour: item.costPerHour || 0,
      recommendation: item.recommendation || 'No recommendation available'
    })) as SubscriptionData[];

    // Calculate total monthly cost
    const totalMonthlyCost = subscriptionsWithROI.reduce((sum, sub) => sum + sub.monthlyAmount, 0);

    // Group by value category
    const groupedByValue = subscriptionsWithROI.reduce((acc, sub) => {
      const category = sub.valueCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(sub);
      return acc;
    }, {} as Record<string, SubscriptionData[]>);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Subscription ROI Calculator</h1>
        <p className="text-muted-foreground">Analyze the value of your subscriptions based on usage and cost</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Monthly Cost</CardTitle>
            <CardDescription>Your subscription expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalMonthlyCost.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {subscriptionsWithROI.length} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Value Breakdown</CardTitle>
            <CardDescription>Categorized by value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <div className="flex-1">Good Value</div>
                <div className="font-medium">{groupedByValue['good']?.length || 0}</div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                <div className="flex-1">Average Value</div>
                <div className="font-medium">{groupedByValue['average']?.length || 0}</div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <div className="flex-1">Poor Value</div>
                <div className="font-medium">{groupedByValue['poor']?.length || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Potential Savings</CardTitle>
            <CardDescription>From poor value subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(groupedByValue['poor'] || []).reduce((sum, sub) => sum + sub.monthlyAmount, 0).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Consider canceling or downgrading these subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">Value Matrix</TabsTrigger>
          <TabsTrigger value="list">Detailed Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="matrix" className="space-y-4">
          <SubscriptionValueMatrix subscriptions={subscriptionsWithROI} />
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <SubscriptionROIList subscriptions={subscriptionsWithROI} />
        </TabsContent>
      </Tabs>
    </div>
    );
  } catch (error) {
    console.error('Error in ROI Calculator:', error);
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Subscription ROI Calculator</h1>
          <p className="text-muted-foreground">Analyze the value of your subscriptions based on usage and cost</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Error Loading Subscription Data</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              We encountered an error while analyzing your subscription data. Please try again later or contact support if the issue persists.
            </p>
            <Button asChild>
              <Link href="/subscriptions">Return to Subscriptions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}
