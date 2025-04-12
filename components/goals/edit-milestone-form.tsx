"use client"

import type React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { updateMilestone } from "@/app/actions/goals"
import { toast } from "@/components/ui/use-toast"

interface EditMilestoneFormProps {
  milestone: {
    id: string
    name: string
    description?: string
    target_amount?: number
    target_date: string
  }
  onComplete: () => void
  onCancel: () => void
}

export function EditMilestoneForm({ milestone, onComplete, onCancel }: EditMilestoneFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState<Date>(new Date(milestone.target_date))
  const [name, setName] = useState(milestone.name)
  const [description, setDescription] = useState(milestone.description || "")
  const [targetAmount, setTargetAmount] = useState(milestone.target_amount?.toString() || "")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.set("name", name)
      formData.set("description", description)
      formData.set("target_date", format(date, "yyyy-MM-dd"))
      if (targetAmount) {
        formData.set("target_amount", targetAmount)
      }

      const result = await updateMilestone(milestone.id, formData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Milestone updated successfully!",
      })
      onComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update milestone. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Milestone name"
          required
        />
      </div>
      <div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Target amount ($)"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
        </div>
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Target date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Milestone"}
        </Button>
      </div>
    </form>
  )
}
