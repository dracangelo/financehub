"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

// Define form schemas for different types of tax information
const deductionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().optional(),
})

const documentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  due_date: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
})

const timelineSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  due_date: z.string().min(1, "Due date is required"),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().optional(),
})

type DeductionFormValues = z.infer<typeof deductionSchema>
type DocumentFormValues = z.infer<typeof documentSchema>
type TimelineFormValues = z.infer<typeof timelineSchema>

export function TaxInfoForm() {
  const [activeTab, setActiveTab] = useState("deduction")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form hooks for each type
  const deductionForm = useForm<DeductionFormValues>({
    resolver: zodResolver(deductionSchema),
    defaultValues: {
      name: "",
      amount: "",
      category: "",
      notes: "",
    },
  })

  const documentForm = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: "",
      type: "",
      due_date: "",
      notes: "",
    },
  })

  const timelineForm = useForm<TimelineFormValues>({
    resolver: zodResolver(timelineSchema),
    defaultValues: {
      title: "",
      description: "",
      due_date: "",
      is_recurring: false,
      recurrence_pattern: "",
    },
  })

  const handleDeductionSubmit = async (values: DeductionFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/tax/deductions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to add deduction")
      }

      setSuccess("Deduction added successfully!")
      deductionForm.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentSubmit = async (values: DocumentFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/tax/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to add document")
      }

      setSuccess("Document added successfully!")
      documentForm.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimelineSubmit = async (values: TimelineFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/tax/timeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to add timeline item")
      }

      setSuccess("Timeline item added successfully!")
      timelineForm.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Tax Information</CardTitle>
        <CardDescription>Add new tax deductions, documents, or timeline items</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deduction">Deduction</TabsTrigger>
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="deduction">
            <form onSubmit={deductionForm.handleSubmit(handleDeductionSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Deduction Name</Label>
                <Input
                  id="name"
                  {...deductionForm.register("name")}
                  error={deductionForm.formState.errors.name ? true : undefined}
                />
                {deductionForm.formState.errors.name && (
                  <p className="text-red-500 text-sm">{deductionForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...deductionForm.register("amount")}
                  error={deductionForm.formState.errors.amount ? true : undefined}
                />
                {deductionForm.formState.errors.amount && (
                  <p className="text-red-500 text-sm">{deductionForm.formState.errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(value) => deductionForm.setValue("category", value)}
                  defaultValue={deductionForm.getValues("category")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="charitable">Charitable</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {deductionForm.formState.errors.category && (
                  <p className="text-red-500 text-sm">{deductionForm.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  {...deductionForm.register("notes")}
                  error={deductionForm.formState.errors.notes ? true : undefined}
                />
                {deductionForm.formState.errors.notes && (
                  <p className="text-red-500 text-sm">{deductionForm.formState.errors.notes.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Deduction"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="document">
            <form onSubmit={documentForm.handleSubmit(handleDocumentSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc-name">Document Name</Label>
                <Input
                  id="doc-name"
                  {...documentForm.register("name")}
                  error={documentForm.formState.errors.name ? true : undefined}
                />
                {documentForm.formState.errors.name && (
                  <p className="text-red-500 text-sm">{documentForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <Select
                  onValueChange={(value) => documentForm.setValue("type", value)}
                  defaultValue={documentForm.getValues("type")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="w2">W-2</SelectItem>
                    <SelectItem value="1099">1099</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="statement">Statement</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {documentForm.formState.errors.type && (
                  <p className="text-red-500 text-sm">{documentForm.formState.errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  {...documentForm.register("due_date")}
                  error={documentForm.formState.errors.due_date ? true : undefined}
                />
                {documentForm.formState.errors.due_date && (
                  <p className="text-red-500 text-sm">{documentForm.formState.errors.due_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-notes">Notes (Optional)</Label>
                <Textarea
                  id="doc-notes"
                  {...documentForm.register("notes")}
                  error={documentForm.formState.errors.notes ? true : undefined}
                />
                {documentForm.formState.errors.notes && (
                  <p className="text-red-500 text-sm">{documentForm.formState.errors.notes.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Document"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="timeline">
            <form onSubmit={timelineForm.handleSubmit(handleTimelineSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...timelineForm.register("title")}
                  error={timelineForm.formState.errors.title ? true : undefined}
                />
                {timelineForm.formState.errors.title && (
                  <p className="text-red-500 text-sm">{timelineForm.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...timelineForm.register("description")}
                  error={timelineForm.formState.errors.description ? true : undefined}
                />
                {timelineForm.formState.errors.description && (
                  <p className="text-red-500 text-sm">{timelineForm.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline-due_date">Due Date</Label>
                <Input
                  id="timeline-due_date"
                  type="date"
                  {...timelineForm.register("due_date")}
                  error={timelineForm.formState.errors.due_date ? true : undefined}
                />
                {timelineForm.formState.errors.due_date && (
                  <p className="text-red-500 text-sm">{timelineForm.formState.errors.due_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_recurring">Recurring</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    {...timelineForm.register("is_recurring")}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_recurring" className="text-sm font-normal">
                    This is a recurring event
                  </Label>
                </div>
              </div>

              {timelineForm.watch("is_recurring") && (
                <div className="space-y-2">
                  <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
                  <Select
                    onValueChange={(value) => timelineForm.setValue("recurrence_pattern", value)}
                    defaultValue={timelineForm.getValues("recurrence_pattern")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Timeline Item"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 