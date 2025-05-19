"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Plus, CreditCard, Home, Car, GraduationCap, Edit, Trash2, Briefcase, Stethoscope } from "lucide-react"
import { DebtDialog } from "@/components/debt/debt-dialog"
// Import the UI Debt type from actions instead of the database Debt type
import { Debt as UIDebt } from "@/app/actions/debts"
// Also import the database Debt type for service operations
import { Debt as DBDebt } from "@/types/debt"
import { DebtService } from "@/lib/debt/debt-service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

export function DebtList() {
  const [open, setOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<UIDebt | null>(null)
  const [debts, setDebts] = useState<UIDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    // Fetch debts when component mounts or when user changes
    if (user || localStorage.getItem('debt-management-visited')) {
      // Set a flag to indicate the user has visited this page
      localStorage.setItem('debt-management-visited', 'true')
      fetchDebts()
    }
  }, [user])

  const fetchDebts = async () => {
    try {
      setLoading(true)
      const debtService = new DebtService()
      
      // Set the user ID if available from auth context
      if (user?.id) {
        console.log(`DebtList: Setting user ID from auth context: ${user.id}`)
        debtService.setUserId(user.id)
      }
      
      // Try to get debts even if we don't have a user ID from context
      // The DebtService will try to get the user ID from the session
      const fetchedDBDebts = await debtService.getDebts()
      
      // Convert DB debts to UI debts format
      const convertedDebts: UIDebt[] = fetchedDBDebts.map(dbDebt => ({
        id: dbDebt.id,
        name: dbDebt.name,
        type: dbDebt.type?.replace('_', '-') || 'personal',
        principal: dbDebt.current_balance,
        interest_rate: dbDebt.interest_rate,
        minimum_payment: dbDebt.minimum_payment,
        term_months: dbDebt.loan_term,
        due_date: dbDebt.due_date || undefined,
        start_date: undefined
      }))
      
      setDebts(convertedDebts)
    } catch (error) {
      console.error("Error fetching debts:", error)
      
      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : "Failed to load debts"
      
      // Don't redirect to login if we've already visited this page
      // This prevents the login loop
      if ((errorMessage.includes("Authentication session expired") || 
          errorMessage.includes("User not authenticated")) && 
          !localStorage.getItem('debt-management-visited')) {
        toast({
          title: "Authentication Notice",
          description: "Attempting to load debts without full authentication",
          variant: "default",
        })
        // Don't redirect to login
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const debtTypeIcons: Record<string, React.ReactNode> = {
    "credit_card": <CreditCard className="h-4 w-4" />,
    "credit-card": <CreditCard className="h-4 w-4" />,
    "mortgage": <Home className="h-4 w-4" />,
    "auto": <Car className="h-4 w-4" />,
    "auto_loan": <Car className="h-4 w-4" />,
    "student": <GraduationCap className="h-4 w-4" />,
    "student_loan": <GraduationCap className="h-4 w-4" />,
    "personal": <Briefcase className="h-4 w-4" />,
    "personal_loan": <Briefcase className="h-4 w-4" />,
    "medical": <Stethoscope className="h-4 w-4" />,
    "other": <CreditCard className="h-4 w-4" />,
  }

  const formatDebtType = (type: string) => {
    return type.replace('_', ' ').replace('-', ' ')
  }
  
  // Function to map UI debt types to database debt types
  const mapUITypeToDBType = (uiType: string | undefined): string => {
    if (!uiType) return 'personal_loan'; // Default to personal_loan if type is undefined
    
    // Map from UI format (with hyphens) to DB format (with underscores)
    const typeMap: Record<string, string> = {
      'credit-card': 'credit_card',
      'auto': 'auto_loan',
      'student': 'student_loan',
      'personal': 'personal_loan',
      'medical': 'medical_debt',
      'mortgage': 'mortgage',
      'other': 'other'
    }
    
    return typeMap[uiType] || 'personal_loan' // Default to personal_loan if type not found
  }

  const handleAddDebt = () => {
    setSelectedDebt(null)
    setOpen(true)
  }

  const handleEditDebt = (debt: UIDebt) => {
    setSelectedDebt(debt)
    setOpen(true)
  }

  const handleDeleteDebt = async (id: string) => {
    try {
      setDeleting(id)
      const debtService = new DebtService()
      
      // Set the user ID if available from auth context
      if (user?.id) {
        console.log(`handleDeleteDebt: Setting user ID from auth context: ${user.id}`)
        debtService.setUserId(user.id)
      }
      
      await debtService.deleteDebt(id)
      
      // Remove the debt from the local state
      setDebts(debts.filter(debt => debt.id !== id))
      
      toast({
        title: "Success",
        description: "Debt deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting debt:", error)
      
      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : "Failed to delete debt"
      if (errorMessage.includes("Authentication session expired") || 
          errorMessage.includes("User not authenticated")) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Redirecting to login...",
          variant: "destructive",
        })
        // Redirect to login page after a short delay
        setTimeout(() => router.push("/login"), 1500)
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setDeleting(null)
    }
  }

  const handleSaveDebt = async (debt: UIDebt) => {
    try {
      const debtService = new DebtService()
      
      // Set the user ID if available from auth context
      if (user?.id) {
        console.log(`handleSaveDebt: Setting user ID from auth context: ${user.id}`)
        debtService.setUserId(user.id)
      }
      
      if (selectedDebt) {
        // Update existing debt - map UI fields to DB fields
        await debtService.updateDebt(debt.id, {
          name: debt.name,
          type: mapUITypeToDBType(debt.type),
          current_balance: debt.principal,
          interest_rate: debt.interest_rate,
          minimum_payment: debt.minimum_payment,
          loan_term: debt.term_months || 0
        })
      } else {
        // Create new debt - map UI fields to DB fields
        await debtService.createDebt({
          name: debt.name,
          type: mapUITypeToDBType(debt.type), // Map UI type format to DB format
          current_balance: debt.principal, // Map principal from UI to current_balance for DB
          interest_rate: debt.interest_rate,
          minimum_payment: debt.minimum_payment,
          loan_term: debt.term_months || 0, // Map term_months from UI to loan_term for DB
          due_date: debt.due_date || null
        })
      }
      
      // Refresh the debts list
      fetchDebts()
      
      setOpen(false)
      toast({
        title: "Success",
        description: selectedDebt ? "Debt updated successfully" : "Debt added successfully",
      })
    } catch (error) {
      console.error("Error saving debt:", error)
      
      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : "Failed to save debt"
      if (errorMessage.includes("Authentication session expired") || 
          errorMessage.includes("User not authenticated")) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Redirecting to login...",
          variant: "destructive",
        })
        // Close the dialog
        setOpen(false)
        // Redirect to login page after a short delay
        setTimeout(() => router.push("/login"), 1500)
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Debts</CardTitle>
              <CardDescription>Manage and track all your debts in one place</CardDescription>
            </div>
            <Button onClick={handleAddDebt}>
              <Plus className="mr-2 h-4 w-4" />
              Add Debt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : debts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No debts added yet. Click "Add Debt" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Min. Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt) => (
                  <TableRow key={debt.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="mr-2 rounded-full bg-muted p-1">
                          {debtTypeIcons[debt.type] || <CreditCard className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{debt.name}</div>
                          <Badge variant="outline" className="mt-1">
                            {formatDebtType(debt.type)}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(debt.principal)}</TableCell>
                    <TableCell>{debt.interest_rate}%</TableCell>
                    <TableCell>{formatCurrency(debt.minimum_payment)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditDebt(debt)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteDebt(debt.id)}
                        disabled={deleting === debt.id}
                      >
                        {deleting === debt.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3">
          <div className="flex w-full items-center justify-between">
            <div className="text-sm text-muted-foreground">Total Debts: {debts.length}</div>
            <div className="font-medium">
              Total Balance: {formatCurrency(debts.reduce((sum, debt) => sum + debt.principal, 0))}
            </div>
          </div>
        </CardFooter>
      </Card>

      <DebtDialog open={open} onOpenChange={setOpen} debt={selectedDebt} onSave={handleSaveDebt} />
    </>
  )
}
