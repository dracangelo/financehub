"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, AlertTriangle, Calendar, FileText, CreditCard, BarChart3, Settings } from "lucide-react"
import { SubscriptionCard } from "./subscription-card"
import { BillNegotiationAssistant } from "./bill-negotiation-assistant"
import { SubscriptionROICalculator } from "./subscription-roi-calculator"
import { SmartPaymentScheduler } from "./smart-payment-scheduler"
import { DuplicateServiceDetector } from "./duplicate-service-detector"
import { PriceIncreaseAlerts } from "./price-increase-alerts"
import { SubscriptionCancellation } from "./subscription-cancellation"
import { PaymentTimeline } from "./payment-timeline"
import { SubscriptionValueMatrix } from "./subscription-value-matrix"
import { BillChangeTracker } from "./bill-change-tracker"
import { PaymentMethodDistribution } from "./payment-method-distribution"
import { SubscriptionForm } from "./subscription-form"

export function SubscriptionManager() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddForm, setShowAddForm] = useState(false)
  
  // In a real app, this would come from your database
  const subscriptions = [
    {
      id: "1",
      name: "Netflix",
      category: "Streaming",
      cost: 15.99,
      billingCycle: "monthly",
      nextBillingDate: new Date(2023, 5, 15),
      usage: 85,
      value: 90,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "Family plan, shared with 3 others"
    },
    {
      id: "2",
      name: "Spotify Premium",
      category: "Music",
      cost: 9.99,
      billingCycle: "monthly",
      nextBillingDate: new Date(2023, 5, 20),
      usage: 95,
      value: 95,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "Student discount applied"
    },
    {
      id: "3",
      name: "Adobe Creative Cloud",
      category: "Software",
      cost: 52.99,
      billingCycle: "monthly",
      nextBillingDate: new Date(2023, 5, 10),
      usage: 60,
      value: 75,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "Photoshop and Illustrator only"
    },
    {
      id: "4",
      name: "New York Times",
      category: "News",
      cost: 17.99,
      billingCycle: "monthly",
      nextBillingDate: new Date(2023, 5, 1),
      usage: 65,
      value: 70,
      paymentMethod: "Bank Account",
      autoRenew: true,
      notes: "Digital subscription"
    },
    {
      id: "5",
      name: "Fitness Plus",
      category: "Fitness",
      cost: 9.99,
      billingCycle: "monthly",
      nextBillingDate: new Date(2023, 5, 5),
      usage: 50,
      value: 60,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "Online fitness classes"
    },
    {
      id: "6",
      name: "Amazon Prime",
      category: "Shopping",
      cost: 139.00,
      billingCycle: "annually",
      nextBillingDate: new Date(2023, 11, 15),
      usage: 70,
      value: 85,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "Includes Prime Video and Music"
    },
    {
      id: "7",
      name: "Coursera Plus",
      category: "Education",
      cost: 59.00,
      billingCycle: "monthly",
      nextBillingDate: new Date(2023, 6, 5),
      usage: 40,
      value: 75,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "Unlimited access to courses"
    },
    {
      id: "8",
      name: "Notion Pro",
      category: "Productivity",
      cost: 8.00,
      billingCycle: "monthly",
      nextBillingDate: new Date(2023, 6, 12),
      usage: 90,
      value: 95,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "Project management and notes"
    },
    {
      id: "9",
      name: "Xbox Game Pass",
      category: "Gaming",
      cost: 14.99,
      billingCycle: "monthly",
      nextBillingDate: new Date(2023, 6, 18),
      usage: 65,
      value: 80,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "Includes EA Play"
    },
    {
      id: "10",
      name: "Google One",
      category: "Cloud Storage",
      cost: 9.99,
      billingCycle: "monthly",
      nextBillingDate: new Date(2023, 6, 22),
      usage: 75,
      value: 70,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "2TB storage plan"
    },
    {
      id: "11",
      name: "YNAB",
      category: "Finance",
      cost: 14.99,
      billingCycle: "monthly",
      nextBillingDate: new Date(2023, 7, 3),
      usage: 80,
      value: 85,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "Budgeting software"
    },
    {
      id: "12",
      name: "Calm",
      category: "Health",
      cost: 69.99,
      billingCycle: "annually",
      nextBillingDate: new Date(2024, 1, 15),
      usage: 30,
      value: 50,
      paymentMethod: "Credit Card",
      autoRenew: true,
      notes: "Meditation and sleep stories"
    }
  ]
  
  const totalMonthlyCost = subscriptions.reduce((total, sub) => {
    if (sub.billingCycle === "monthly") {
      return total + sub.cost
    } else if (sub.billingCycle === "weekly") {
      return total + (sub.cost * 4.33) // Average weeks per month
    } else if (sub.billingCycle === "biweekly") {
      return total + (sub.cost * 2.17) // Average bi-weeks per month
    } else if (sub.billingCycle === "quarterly") {
      return total + (sub.cost / 3)
    } else if (sub.billingCycle === "semi-annually") {
      return total + (sub.cost / 6)
    } else if (sub.billingCycle === "annually") {
      return total + (sub.cost / 12)
    }
    return total
  }, 0)
  
  const upcomingPayments = subscriptions
    .filter(sub => {
      const today = new Date()
      const nextBilling = new Date(sub.nextBillingDate)
      const daysUntilBilling = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilBilling <= 30
    })
    .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
  
  const lowUsageSubscriptions = subscriptions.filter(sub => sub.usage < 50)
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bill & Subscription Management</CardTitle>
            <CardDescription>
              Track, analyze, and optimize your recurring bills and subscriptions
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Monthly Cost</p>
                    <p className="text-2xl font-bold">${totalMonthlyCost.toFixed(2)}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Upcoming Payments</p>
                    <p className="text-2xl font-bold">{upcomingPayments.length}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-2">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Low Usage Alerts</p>
                    <p className="text-2xl font-bold">{lowUsageSubscriptions.length}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="negotiation">Negotiation</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="cancellation">Cancellation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Subscriptions</CardTitle>
                <CardDescription>
                  Manage your active subscriptions and recurring bills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptions.map(subscription => (
                    <SubscriptionCard key={subscription.id} subscription={subscription} />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Timeline</CardTitle>
                  <CardDescription>
                    Optimized payment schedule for better cash flow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentTimeline subscriptions={upcomingPayments} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Value Matrix</CardTitle>
                  <CardDescription>
                    Cost vs. usage analysis for your subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionValueMatrix subscriptions={subscriptions} />
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bill Change Tracker</CardTitle>
                <CardDescription>
                  Historical price increases and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BillChangeTracker subscriptions={subscriptions} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
                <CardDescription>
                  Optimize your payment methods for maximum rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentMethodDistribution subscriptions={subscriptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="negotiation">
          <BillNegotiationAssistant subscriptions={subscriptions} />
        </TabsContent>
        
        <TabsContent value="roi">
          <SubscriptionROICalculator subscriptions={subscriptions} />
        </TabsContent>
        
        <TabsContent value="scheduling">
          <SmartPaymentScheduler subscriptions={subscriptions} />
        </TabsContent>
        
        <TabsContent value="duplicates">
          <DuplicateServiceDetector subscriptions={subscriptions} />
        </TabsContent>
        
        <TabsContent value="alerts">
          <PriceIncreaseAlerts subscriptions={subscriptions} />
        </TabsContent>
        
        <TabsContent value="cancellation">
          <SubscriptionCancellation subscriptions={subscriptions} />
        </TabsContent>
      </Tabs>
      
      {showAddForm && (
        <SubscriptionForm 
          onClose={() => setShowAddForm(false)} 
          onSave={(subscription) => {
            // In a real app, this would save to your database
            console.log("Saving subscription:", subscription)
            setShowAddForm(false)
          }} 
        />
      )}
    </div>
  )
} 