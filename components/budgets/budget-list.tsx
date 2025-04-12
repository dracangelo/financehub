"use client"

import { useState } from "react"
import { toast } from "sonner"
import { deleteBudget } from "@/app/actions/budgets"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Pencil, Trash } from "lucide-react"
import { BudgetForm } from "./budget-form"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface Budget {
  id: string
  category_id: string
  amount: number
  start_date: string
  end_date?: string | null
  budget_category?: {
    id: string
    name: string
    amount_allocated: number
  }[]
}

interface BudgetListProps {
  budgets: Budget[]
}

export function BudgetList({ budgets }: BudgetListProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setLoading(id)
    try {
      await deleteBudget(id)
      toast.success("Budget deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete budget")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => (
        <Card key={budget.id}>
          <CardHeader>
            <CardTitle>
              {budget.budget_category?.[0]?.name || "Untitled Budget"}
            </CardTitle>
            <CardDescription>
              ${budget.amount.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Start Date: {new Date(budget.start_date).toLocaleDateString()}</p>
              {budget.end_date && (
                <p>End Date: {new Date(budget.end_date).toLocaleDateString()}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <BudgetForm budget={budget} />
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  {loading === budget.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this budget? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(budget.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
