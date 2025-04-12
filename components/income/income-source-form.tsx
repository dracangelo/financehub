"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createIncomeSource, updateIncomeSource } from "@/app/actions/income-sources"
import { getLatestCurrencyRates } from "@/app/actions/currency-rates"
import { getAvailableCurrencies } from "@/lib/currency-utils"
import type { IncomeSource } from "@/types/income"
import { AlertCircle, CheckCircle2, Loader2, HelpCircle, DollarSign, Calendar, AlarmClock, BarChart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface IncomeSourceFormProps {
  incomeSource?: IncomeSource
  isEditing?: boolean
}

export function IncomeSourceForm({ incomeSource, isEditing = false }: IncomeSourceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(["USD", "EUR", "GBP", "CAD", "AUD", "JPY"])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [formTab, setFormTab] = useState<string>("basic")
  
  // Form state for real-time calculations and previews
  const [amount, setAmount] = useState<number>(incomeSource?.amount || 0)
  const [frequency, setFrequency] = useState<string>(incomeSource?.frequency || "monthly")
  const [notes, setNotes] = useState<string>(incomeSource?.notes || "")
  const [isTaxable, setIsTaxable] = useState<boolean>(incomeSource?.is_taxable !== false)
  const [showMonthlyEquivalent, setShowMonthlyEquivalent] = useState<boolean>(true)
  const [previewingNotes, setPreviewingNotes] = useState<boolean>(false)

  // Calculate monthly equivalent amount
  const calculateMonthlyAmount = useCallback((amt: number, freq: string) => {
    switch (freq) {
      case "daily":
        return amt * 30.42; // Average days in a month
      case "weekly":
        return amt * 4.33; // Average weeks in a month
      case "bi-weekly":
        return amt * 2.17; // Bi-weekly periods in a month
      case "monthly":
        return amt;
      case "quarterly":
        return amt / 3;
      case "annually":
        return amt / 12;
      case "one-time":
        return amt / 12; // Spread one-time income over a year by default
      default:
        return amt;
    }
  }, []);

  const monthlyEquivalent = calculateMonthlyAmount(amount, frequency);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const rates = await getLatestCurrencyRates()
        const currencies = getAvailableCurrencies(rates)

        if (currencies.length > 0) {
          setAvailableCurrencies(currencies)
        }
      } catch (error) {
        console.error("Error fetching currencies:", error)
      }
    }

    fetchCurrencies()
  }, [])

  // Initialize form state from incomeSource if editing
  useEffect(() => {
    if (incomeSource) {
      setAmount(incomeSource.amount || 0)
      setFrequency(incomeSource.frequency || "monthly")
      setNotes(incomeSource.notes || "")
      setIsTaxable(incomeSource.is_taxable !== false)
    }
  }, [incomeSource])

  const handleCancel = () => {
    router.push("/income")
  }

  // Simple markdown to HTML converter for notes preview
  const renderMarkdown = (text: string) => {
    if (!text) return "";
    
    // Convert headers
    let html = text.replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    
    // Convert bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert lists
    html = html.replace(/^\* (.*$)/gm, '<li>$1</li>')
    html = html.replace(/<\/li>\n<li>/g, '</li><li>')
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    
    // Convert line breaks
    html = html.replace(/\n/g, '<br>')
    
    return html;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      // Create a new FormData from the event
      const formData = new FormData(event.currentTarget)
      
      // Explicitly add all state-managed values to ensure they're included
      formData.set("name", event.currentTarget.name.value)
      formData.set("type", event.currentTarget.type.value)
      formData.set("amount", amount.toString())
      formData.set("frequency", frequency)
      formData.set("currency", event.currentTarget.currency.value)
      formData.set("is_taxable", isTaxable ? "true" : "false")
      
      // Add optional fields only if they have values
      if (event.currentTarget.start_date.value) {
        formData.set("start_date", event.currentTarget.start_date.value)
      }
      
      if (event.currentTarget.end_date.value) {
        formData.set("end_date", event.currentTarget.end_date.value)
      }
      
      if (notes) {
        formData.set("notes", notes)
      }

      // Additional validation
      const name = formData.get("name") as string;
      if (!name || name.trim() === "") {
        setError("Name is required")
        setLoading(false)
        return
      }

      // Validate amount
      const amountValue = formData.get("amount") as string
      if (isNaN(Number(amountValue)) || Number(amountValue) < 0) {
        setError("Amount must be a valid positive number")
        setLoading(false)
        return
      }

      console.log("Submitting form data:", Object.fromEntries(formData.entries()))

      if (isEditing && incomeSource) {
        const result = await updateIncomeSource(incomeSource.id, formData)
        console.log("Update result:", result)
        setSuccess(true)
        
        // Show success toast
        toast({
          title: "Income source updated",
          description: "Your income source has been successfully updated.",
          variant: "success",
        })
        
        // Wait a moment to show success state before redirecting
        setTimeout(() => {
          router.push("/income")
          router.refresh()
        }, 1500)
      } else {
        const result = await createIncomeSource(formData)
        console.log("Create result:", result)
        toast({
          title: "Income source created",
          description: "Your new income source has been successfully added.",
          variant: "success",
        })
        router.push("/income")
        router.refresh()
      }
    } catch (error) {
      console.error("Error saving income source:", error)
      let errorMessage = "Failed to save income source. Please try again."
      
      // Try to extract more specific error message if available
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }
      
      setError(errorMessage)
      
      // Show error toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 shadow-sm">
          <div className="flex items-center">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            <span>Income source updated successfully!</span>
          </div>
        </div>
      )}

      {showMonthlyEquivalent && amount > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Monthly Equivalent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <span className="text-2xl font-bold text-blue-800">
                {monthlyEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-blue-600">per month</span>
            </div>
            <p className="mt-1 text-xs text-blue-600">
              This is how much your {frequency} income of {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} equals monthly.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Primary Job, Freelancing, etc."
                  defaultValue={incomeSource?.name}
                  required
                  disabled={loading}
                  className="focus-visible:ring-blue-500"
                />
                <p className="text-xs text-muted-foreground">A descriptive name for this income source</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Type
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <Select name="type" defaultValue={incomeSource?.type} required disabled={loading}>
                  <SelectTrigger id="type" className="focus-visible:ring-blue-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: "salary", label: "Salary", description: "Regular employment income" },
                      { value: "bonus", label: "Bonus", description: "Performance or seasonal bonus" },
                      { value: "freelance", label: "Freelance", description: "Contract or gig work" },
                      { value: "rental", label: "Rental", description: "Income from property" },
                      { value: "investment", label: "Investment", description: "Dividends, interest, capital gains" },
                      { value: "passive", label: "Passive", description: "Royalties, digital products" },
                      { value: "other", label: "Other", description: "Other income sources" }
                    ].map((item) => (
                      <SelectItem key={`type-${item.value}`} value={item.value}>
                        <div className="flex flex-col">
                          <span>{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Categorize your income source</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    disabled={loading}
                    className="pl-8 focus-visible:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground">How much you earn from this source</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">
                  Frequency
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <Select 
                  name="frequency" 
                  value={frequency}
                  onValueChange={setFrequency}
                  required 
                  disabled={loading}
                >
                  <SelectTrigger id="frequency" className="focus-visible:ring-blue-500">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                      { value: "bi-weekly", label: "Bi-weekly" },
                      { value: "monthly", label: "Monthly" },
                      { value: "quarterly", label: "Quarterly" },
                      { value: "annually", label: "Annually" },
                      { value: "one-time", label: "One-time" }
                    ].map((item) => (
                      <SelectItem key={`frequency-${item.value}`} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How often you receive this income</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select name="currency" defaultValue={incomeSource?.currency || "USD"} disabled={loading}>
                  <SelectTrigger id="currency" className="focus-visible:ring-blue-500">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((currency) => (
                      <SelectItem key={`currency-${currency}`} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Currency of this income</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="start_date">Start Date</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-64">When did you start receiving this income? This helps with historical analysis.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="start_date" 
                    name="start_date" 
                    type="date" 
                    defaultValue={incomeSource?.start_date?.split("T")[0]} 
                    disabled={loading}
                    className="pl-8 focus-visible:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground">When did this income source start?</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="end_date">End Date</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-64">Optional: When will this income source end? Leave blank for ongoing sources.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="end_date" 
                    name="end_date" 
                    type="date" 
                    defaultValue={incomeSource?.end_date?.split("T")[0]} 
                    disabled={loading}
                    className="pl-8 focus-visible:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground">When will this income source end? (Optional)</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_taxable" 
                  checked={isTaxable}
                  onCheckedChange={setIsTaxable}
                />
                <Label htmlFor="is_taxable">Taxable Income</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-64">Is this income subject to taxation? This helps with tax planning.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="show_monthly_equivalent"
                  checked={showMonthlyEquivalent}
                  onCheckedChange={setShowMonthlyEquivalent}
                />
                <Label htmlFor="show_monthly_equivalent">Show Monthly Equivalent</Label>
              </div>
              
              <input type="hidden" name="is_taxable" value={isTaxable ? "true" : "false"} />
              
              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notes">Notes</Label>
                  <div className="flex items-center space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPreviewingNotes(!previewingNotes)}
                    >
                      {previewingNotes ? "Edit" : "Preview"}
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">Supports basic Markdown: **bold**, *italic*, # headers, and * lists</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                {!previewingNotes ? (
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional details about this income source..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={loading}
                    className="min-h-32 focus-visible:ring-blue-500"
                  />
                ) : (
                  <div 
                    className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(notes) }}
                  />
                )}
                <p className="text-xs text-muted-foreground">Any additional details or context about this income source</p>
              </div>
            </div>
          </TabsContent>
          
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Saving..."}
                </>
              ) : isEditing ? (
                "Update Income Source" 
              ) : (
                "Add Income Source"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
