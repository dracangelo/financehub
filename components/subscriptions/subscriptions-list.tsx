"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SubscriptionDialog } from "@/components/subscriptions/subscription-dialog"
import { getSubscriptions, deleteSubscription } from "@/app/actions/subscriptions"
import { formatCurrency } from "@/lib/utils"
import { Calendar, Plus, Edit, Trash2, AlertCircle, ExternalLink } from "lucide-react"

interface Subscription {
  id: string
  name: string
  provider: string
  amount: number
  billing_cycle?: string
  billing_frequency?: string
  next_billing_date?: string
  next_payment_date?: string
  status?: string
  auto_renew?: boolean
  auto_pay?: boolean
  usage_frequency?: string
  usage_value?: number
  usage_level?: string
  cancellation_url?: string | null
  payment_method?: string
  categories?: { name: string; color: string }
  payment_methods?: { name: string; type: string }
  biller?: {
    id?: string
    name?: string
    category?: string
    website_url?: string
    support_contact?: string
  }
}

export function SubscriptionsList() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null)
  const [totalMonthly, setTotalMonthly] = useState(0)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const data = await getSubscriptions()
        setSubscriptions(data)
        calculateTotalMonthly(data)
      } catch (err) {
        setError("Error fetching subscriptions")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [])

  const calculateTotalMonthly = (subs: Subscription[]) => {
    let total = 0

    subs.forEach((sub) => {
      let monthlyAmount = sub.amount

      // Convert to monthly amount based on billing cycle
      switch (sub.billing_cycle) {
        case "weekly":
          monthlyAmount = sub.amount * 4.33 // Average weeks in a month
          break
        case "biweekly":
          monthlyAmount = sub.amount * 2.17 // Average bi-weeks in a month
          break
        case "quarterly":
          monthlyAmount = sub.amount / 3
          break
        case "semiannually":
          monthlyAmount = sub.amount / 6
          break
        case "annually":
          monthlyAmount = sub.amount / 12
          break
      }

      total += monthlyAmount
    })

    setTotalMonthly(Math.round(total * 100) / 100)
  }

  const handleAddSubscription = () => {
    setSelectedSubscription(null)
    setOpenDialog(true)
  }

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setOpenDialog(true)
  }

  const handleDeleteSubscription = (id: string) => {
    setSubscriptionToDelete(id)
    setOpenDeleteDialog(true)
  }

  const confirmDeleteSubscription = async () => {
    if (!subscriptionToDelete) return

    try {
      await deleteSubscription(subscriptionToDelete)
      const updatedSubscriptions = subscriptions.filter((sub) => sub.id !== subscriptionToDelete)
      setSubscriptions(updatedSubscriptions)
      calculateTotalMonthly(updatedSubscriptions)
      setOpenDeleteDialog(false)
      setSubscriptionToDelete(null)
    } catch (err) {
      console.error("Error deleting subscription:", err)
    }
  }

  const handleSaveSubscription = async () => {
    // Refresh subscriptions list
    try {
      const data = await getSubscriptions()
      setSubscriptions(data)
      calculateTotalMonthly(data)
      setOpenDialog(false)
    } catch (err) {
      console.error("Error refreshing subscriptions:", err)
    }
  }

  const getUsageFrequencyBadge = (frequency: string) => {
    switch (frequency) {
      case "high":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            High Usage
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Medium Usage
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Low Usage
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">Subscriptions</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">Subscriptions</h2>
          <Button onClick={handleAddSubscription}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => setLoading(true)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold tracking-tight">Subscriptions</h2>
        <Button onClick={handleAddSubscription}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="font-medium">No subscriptions yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first subscription to start tracking your recurring expenses.
            </p>
            <Button variant="outline" className="mt-4" onClick={handleAddSubscription}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>Total monthly cost: {formatCurrency(totalMonthly)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Auto Renew</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="font-medium">{subscription.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {subscription.categories?.name || subscription.biller?.category || "Uncategorized"}
                      </div>
                    </TableCell>
                    <TableCell>{subscription.provider || subscription.biller?.name || "Unknown Provider"}</TableCell>
                    <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                    <TableCell className="capitalize">{subscription.billing_cycle ? subscription.billing_cycle.replace(/_/g, " ") : 
                      subscription.billing_frequency ? subscription.billing_frequency.replace(/_/g, " ") : "Unknown"}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : 
                         subscription.next_payment_date ? new Date(subscription.next_payment_date).toLocaleDateString() : 
                         "No date available"}
                      </div>
                    </TableCell>
                    <TableCell>{getUsageFrequencyBadge(
                      subscription.usage_frequency || 
                      (typeof subscription.usage_value === 'number' ? 
                        (subscription.usage_value > 6 ? 'high' : subscription.usage_value > 3 ? 'medium' : 'low') : 
                        subscription.usage_level || "medium")
                    )}</TableCell>
                    <TableCell>
                      {subscription.auto_renew || subscription.auto_pay ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {subscription.payment_method || "Not specified"}
                    </TableCell>
                    <TableCell className="text-right">
                      {subscription.cancellation_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(subscription.cancellation_url!, "_blank")}
                          title="Cancellation page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditSubscription(subscription)}
                        title="Edit subscription"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubscription(subscription.id)}
                        title="Delete subscription"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <SubscriptionDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        subscription={selectedSubscription}
        onSave={handleSaveSubscription}
      />

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this subscription and remove it from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSubscription}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

