"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Report, deleteReport } from "@/app/actions/reports"
import { format } from "date-fns"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { FileDown, Trash2, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react"

interface ReportsListProps {
  reports: Report[]
}

export function ReportsList({ reports }: ReportsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDownload = (report: Report) => {
    // For the in-memory version, generate a downloadable file on the client side
    if (!report.file_url || report.file_url.startsWith('https://storage.example.com')) {
      // Generate sample data based on report type
      let sampleData = [];
      
      switch (report.type) {
        case 'overview':
          sampleData = [
            { date: '2025-04-01', category: 'Income', amount: 5000, description: 'Salary' },
            { date: '2025-04-05', category: 'Housing', amount: -1500, description: 'Rent' },
            { date: '2025-04-10', category: 'Utilities', amount: -120, description: 'Electricity' },
            { date: '2025-04-15', category: 'Food', amount: -350, description: 'Groceries' },
            { date: '2025-04-20', category: 'Transportation', amount: -200, description: 'Gas' }
          ];
          break;
        case 'income-expense':
          sampleData = [
            { date: '2025-04-01', category: 'Salary', amount: 5000, type: 'income' },
            { date: '2025-04-15', category: 'Freelance', amount: 1200, type: 'income' },
            { date: '2025-04-05', category: 'Housing', amount: 1500, type: 'expense' },
            { date: '2025-04-10', category: 'Utilities', amount: 120, type: 'expense' },
            { date: '2025-04-15', category: 'Food', amount: 350, type: 'expense' }
          ];
          break;
        case 'net-worth':
          sampleData = [
            { name: 'Checking Account', type: 'asset', value: 5000, category: 'Cash' },
            { name: 'Savings Account', type: 'asset', value: 15000, category: 'Cash' },
            { name: 'Investment Portfolio', type: 'asset', value: 50000, category: 'Investments' },
            { name: 'Home', type: 'asset', value: 350000, category: 'Real Estate' },
            { name: 'Car Loan', type: 'liability', value: 12000, category: 'Loans' },
            { name: 'Mortgage', type: 'liability', value: 250000, category: 'Loans' },
            { name: 'Credit Card', type: 'liability', value: 3000, category: 'Debt' }
          ];
          break;
        case 'investments':
          sampleData = [
            { ticker: 'AAPL', name: 'Apple Inc.', shares: 10, price: 175.50, value: 1755.00, cost_basis: 1500.00 },
            { ticker: 'MSFT', name: 'Microsoft Corp.', shares: 5, price: 350.25, value: 1751.25, cost_basis: 1600.00 },
            { ticker: 'GOOGL', name: 'Alphabet Inc.', shares: 3, price: 2800.00, value: 8400.00, cost_basis: 7500.00 },
            { ticker: 'AMZN', name: 'Amazon.com Inc.', shares: 2, price: 3200.00, value: 6400.00, cost_basis: 5800.00 },
            { ticker: 'TSLA', name: 'Tesla Inc.', shares: 8, price: 950.00, value: 7600.00, cost_basis: 8000.00 }
          ];
          break;
        default:
          sampleData = [{ message: 'No data available' }];
      }
      
      // Generate file content based on format
      let fileContent = '';
      let fileName = `${report.type}_report.${report.format === 'excel' ? 'xlsx' : report.format}`;
      let mimeType = '';
      
      switch (report.format) {
        case 'csv':
          // Generate CSV content
          if (sampleData.length > 0) {
            // Get headers from first object
            const headers = Object.keys(sampleData[0]).join(',');
            // Get values
            const rows = sampleData.map(item => 
              Object.values(item).map(val => 
                typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
              ).join(',')
            ).join('\n');
            
            fileContent = `${headers}\n${rows}`;
          } else {
            fileContent = 'No data available';
          }
          mimeType = 'text/csv';
          break;
          
        case 'excel':
          // For demo, we'll just use CSV format but with an xlsx extension
          if (sampleData.length > 0) {
            const headers = Object.keys(sampleData[0]).join(',');
            const rows = sampleData.map(item => 
              Object.values(item).map(val => 
                typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
              ).join(',')
            ).join('\n');
            
            fileContent = `${headers}\n${rows}`;
          } else {
            fileContent = 'No data available';
          }
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
          
        case 'pdf':
        default:
          // For demo, we'll create a simple text representation
          // In a real app, you would use a PDF generation library
          fileContent = `${report.title}\n\nGenerated: ${new Date().toISOString()}\n\nData Records: ${sampleData.length}`;
          
          if (sampleData.length > 0) {
            fileContent += '\n\nSample Data:\n' + JSON.stringify(sampleData, null, 2);
          } else {
            fileContent += '\n\nNo data available';
          }
          mimeType = 'text/plain';
          fileName = `${report.type}_report.txt`; // Use .txt instead of .pdf since we're not generating a real PDF
          break;
      }
      
      // Create a Blob and trigger download
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success("Report downloaded", {
        description: `${report.title} has been downloaded`
      });
      return;
    }

    // For real database-stored reports with valid URLs
    if (!report.file_url) {
      toast.error("Report file not available", {
        description: "The report is still being generated or failed to generate."
      })
      return
    }

    // In a real app, this would download the file
    toast.success("Downloading report", {
      description: `${report.title} is being downloaded`
    })
    
    // Simulate opening the file in a new tab
    window.open(report.file_url, '_blank')
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteReport(id)
      toast.success("Report deleted", {
        description: "The report has been successfully deleted"
      })
      router.refresh()
    } catch (error) {
      console.error("Error deleting report:", error)
      toast.error("Failed to delete report", {
        description: "Please try again later"
      })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case 'processing':
        return <Badge variant="secondary" className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Processing</Badge>
      case 'completed':
        return <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" /> Completed</Badge>
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Reports</CardTitle>
          <CardDescription>
            You haven't generated any reports yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              Use the generator to create your first report
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Reports</CardTitle>
        <CardDescription>
          View and download your generated reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">
                  {report.title}
                  {report.description && (
                    <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                  )}
                </TableCell>
                <TableCell>{formatReportType(report.type)}</TableCell>
                <TableCell className="uppercase">{report.format}</TableCell>
                <TableCell>{format(new Date(report.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>{getStatusBadge(report.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownload(report)}
                      disabled={report.status !== 'completed' || !report.file_url}
                      title={report.status !== 'completed' ? "Report not ready" : "Download report"}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          disabled={deletingId === report.id}
                        >
                          {deletingId === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Report</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this report? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.preventDefault()
                              handleDelete(report.id)
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Helper function to format report type
function formatReportType(type: Report['type']): string {
  switch (type) {
    case 'overview':
      return 'Financial Overview'
    case 'income-expense':
      return 'Income & Expenses'
    case 'net-worth':
      return 'Net Worth'
    case 'investments':
      return 'Investment Performance'
    default:
      return type
  }
}
