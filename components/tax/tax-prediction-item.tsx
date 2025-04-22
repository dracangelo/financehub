"use client"

import { useState } from "react"
import { Edit, Trash2, MoreHorizontal, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

export interface TaxPrediction {
  id: string
  scenario: string
  description?: string
  current_tax_burden: number
  predicted_tax_burden: number
  difference: number
  notes?: string
}

interface TaxPredictionItemProps {
  prediction: TaxPrediction
  onEdit: (prediction: TaxPrediction) => void
  onDelete: (id: string) => void
}

export function TaxPredictionItem({ 
  prediction, 
  onEdit, 
  onDelete 
}: TaxPredictionItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await onDelete(prediction.id)
      setConfirmDelete(false)
      toast({
        title: "Prediction deleted",
        description: "The tax prediction has been successfully deleted.",
      })
    } catch (error) {
      toast({
        title: "Error deleting prediction",
        description: "There was a problem deleting the tax prediction.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Determine if the prediction is positive (saving money) or negative (costing money)
  const isPositive = prediction.difference < 0
  
  return (
    <>
      <div className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
        <div className="mt-1">
          {isPositive ? (
            <TrendingDown className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingUp className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{prediction.scenario}</h4>
            <div className="flex items-center space-x-2">
              <Badge variant={isPositive ? "default" : "destructive"}>
                {isPositive ? "Savings" : "Cost"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(prediction)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {prediction.description && (
            <p className="text-sm text-muted-foreground mt-1">{prediction.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-sm text-muted-foreground">Current Tax Burden</p>
              <p className="font-medium">{formatCurrency(prediction.current_tax_burden)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Predicted Tax Burden</p>
              <p className="font-medium">{formatCurrency(prediction.predicted_tax_burden)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Difference</p>
              <p className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(prediction.difference)}
              </p>
            </div>
          </div>
          
          {prediction.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              Note: {prediction.notes}
            </p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tax Prediction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{prediction.scenario}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
