"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Calculator, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TaxPredictionItem, TaxPrediction } from "./tax-prediction-item"
import { useToast } from "@/components/ui/use-toast"
import { EmptyState } from "@/components/empty-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function TaxPredictionList() {
  const [predictions, setPredictions] = useState<TaxPrediction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingPrediction, setEditingPrediction] = useState<TaxPrediction | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    scenario: "",
    description: "",
    current_tax_burden: "",
    predicted_tax_burden: "",
    notes: ""
  })

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tax/predictions')
      if (!response.ok) {
        throw new Error('Failed to fetch predictions')
      }
      const data = await response.json()
      setPredictions(data)
    } catch (error) {
      console.error("Error fetching tax predictions:", error)
      toast({
        title: "Error loading predictions",
        description: "There was a problem loading your tax predictions.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      scenario: "",
      description: "",
      current_tax_burden: "",
      predicted_tax_burden: "",
      notes: ""
    })
    setEditingPrediction(null)
  }

  const handleEditPrediction = (prediction: TaxPrediction) => {
    setEditingPrediction(prediction)
    setFormData({
      scenario: prediction.scenario,
      description: prediction.description || "",
      current_tax_burden: prediction.current_tax_burden.toString(),
      predicted_tax_burden: prediction.predicted_tax_burden.toString(),
      notes: prediction.notes || ""
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Parse numeric values
      const currentTaxBurden = parseFloat(formData.current_tax_burden)
      const predictedTaxBurden = parseFloat(formData.predicted_tax_burden)
      
      if (isNaN(currentTaxBurden) || isNaN(predictedTaxBurden)) {
        throw new Error("Tax burden values must be valid numbers")
      }
      
      // Calculate difference
      const difference = predictedTaxBurden - currentTaxBurden

      // Create data object for API
      const data = {
        scenario: formData.scenario,
        description: formData.description || undefined,
        current_tax_burden: currentTaxBurden,
        predicted_tax_burden: predictedTaxBurden,
        difference: difference,
        notes: formData.notes || undefined
      }

      let response
      
      if (editingPrediction) {
        // Update existing prediction
        response = await fetch(`/api/tax/predictions/${editingPrediction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            decision_type: formData.scenario, // Map to existing API field
            estimated_tax_impact: difference // Map to existing API field
          })
        })
      } else {
        // Create new prediction
        response = await fetch('/api/tax/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            decision_type: formData.scenario, // Map to existing API field
            estimated_tax_impact: difference // Map to existing API field
          })
        })
      }

      if (!response.ok) {
        throw new Error('Failed to save prediction')
      }

      const result = await response.json()
      
      // Transform API response to match our interface
      const transformedResult: TaxPrediction = {
        id: result.id,
        scenario: result.decision_type || result.scenario,
        description: result.description,
        current_tax_burden: currentTaxBurden,
        predicted_tax_burden: predictedTaxBurden,
        difference: difference,
        notes: result.notes
      }
      
      if (editingPrediction) {
        setPredictions(prev => 
          prev.map(item => item.id === editingPrediction.id ? transformedResult : item)
        )
        toast({
          title: "Prediction updated",
          description: "Your tax prediction has been successfully updated."
        })
      } else {
        setPredictions(prev => [...prev, transformedResult])
        toast({
          title: "Prediction created",
          description: "Your tax prediction has been successfully created."
        })
      }
      
      setShowForm(false)
      resetForm()
    } catch (error) {
      console.error("Error saving tax prediction:", error)
      toast({
        title: "Error saving prediction",
        description: typeof error === 'object' && error !== null && 'message' in error 
          ? (error as Error).message 
          : "There was a problem saving your tax prediction.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePrediction = async (id: string) => {
    try {
      const response = await fetch(`/api/tax/predictions/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete prediction')
      }
      
      setPredictions(prev => prev.filter(item => item.id !== id))
      toast({
        title: "Prediction deleted",
        description: "Your tax prediction has been successfully deleted."
      })
    } catch (error) {
      console.error("Error deleting tax prediction:", error)
      toast({
        title: "Error deleting prediction",
        description: "There was a problem deleting your tax prediction.",
        variant: "destructive"
      })
      throw error
    }
  }

  // Filter predictions based on search query
  const filteredPredictions = predictions.filter(prediction => 
    prediction.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (prediction.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (prediction.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  )

  // Calculate total potential savings
  const totalSavings = filteredPredictions
    .filter(prediction => prediction.difference < 0)
    .reduce((total, prediction) => total + Math.abs(prediction.difference), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tax Impact Predictions</CardTitle>
            <CardDescription>See how financial decisions affect your tax burden</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Prediction
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search predictions..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Card */}
        {filteredPredictions.length > 0 && (
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Total Potential Savings</h3>
                <p className="text-2xl font-bold text-green-600">${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredPredictions.length} {filteredPredictions.length === 1 ? 'prediction' : 'predictions'}
              </div>
            </div>
          </div>
        )}

        {/* Predictions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPredictions.length > 0 ? (
          <div className="space-y-4">
            {filteredPredictions.map((prediction) => (
              <TaxPredictionItem
                key={prediction.id}
                prediction={prediction}
                onEdit={handleEditPrediction}
                onDelete={handleDeletePrediction}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Calculator className="h-12 w-12 text-muted-foreground" />}
            title="No predictions found"
            description={
              searchQuery
                ? "No predictions match your search criteria. Try a different search term."
                : "You haven't added any tax impact predictions yet. Add your first prediction to get started."
            }
            action={
              !searchQuery && (
                <Button onClick={() => { resetForm(); setShowForm(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Prediction
                </Button>
              )
            }
          />
        )}

        {/* Prediction Form Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open)
          if (!open) resetForm()
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingPrediction ? "Edit" : "Add"} Tax Prediction</DialogTitle>
              <DialogDescription>
                {editingPrediction 
                  ? "Update the details of this tax prediction." 
                  : "Create a new tax prediction to see how financial decisions affect your taxes."}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scenario">Scenario</Label>
                <Input
                  id="scenario"
                  name="scenario"
                  placeholder="e.g., Increasing 401(k) Contributions"
                  value={formData.scenario}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the scenario in detail"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_tax_burden">Current Tax Burden ($)</Label>
                  <Input
                    id="current_tax_burden"
                    name="current_tax_burden"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 10000"
                    value={formData.current_tax_burden}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="predicted_tax_burden">Predicted Tax Burden ($)</Label>
                  <Input
                    id="predicted_tax_burden"
                    name="predicted_tax_burden"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 9000"
                    value={formData.predicted_tax_burden}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional notes about this prediction"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingPrediction ? "Update Prediction" : "Add Prediction"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
