"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { generateReport, ReportRequest, ReportType, ReportFormat, TimeRange } from "@/app/actions/reports"
import { Loader2 } from "lucide-react"

const reportFormSchema = z.object({
  type: z.enum(["overview", "income-expense", "net-worth", "investments"] as const),
  format: z.enum(["pdf", "csv", "excel"] as const),
  timeRange: z.enum(["7d", "30d", "90d", "1y", "ytd", "all"] as const),
  title: z.string().optional(),
  description: z.string().optional(),
})

type ReportFormValues = z.infer<typeof reportFormSchema>

export function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      type: "overview",
      format: "pdf",
      timeRange: "30d",
      title: "",
      description: "",
    },
  })

  async function onSubmit(data: ReportFormValues) {
    setIsGenerating(true)
    try {
      const reportRequest: ReportRequest = {
        type: data.type as ReportType,
        format: data.format as ReportFormat,
        timeRange: data.timeRange as TimeRange,
        title: data.title || undefined,
        description: data.description || undefined,
      }

      await generateReport(reportRequest)
      toast.success("Report generation started", {
        description: "You'll be notified when your report is ready",
      })
      router.refresh()
      form.reset()
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Failed to generate report", {
        description: "Please try again later",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
        <CardDescription>
          Create a custom report based on your financial data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="overview">Financial Overview</SelectItem>
                      <SelectItem value="income-expense">Income & Expenses</SelectItem>
                      <SelectItem value="net-worth">Net Worth</SelectItem>
                      <SelectItem value="investments">Investment Performance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the type of financial data to include in your report
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Format</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the file format for your report
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="1y">Last Year</SelectItem>
                      <SelectItem value="ytd">Year to Date</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the time period to include in your report
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Title (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a custom title for your report" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to use a default title based on the report type
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes or context for this report"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
