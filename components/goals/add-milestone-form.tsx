"use client"

import type React from "react"

import { useState } from "react"
import { createMilestone } from "@/app/actions/goals"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface AddMilestoneFormProps {
  goalId: string
  onComplete: () => void
}

export function AddMilestoneForm({ goalId, onComplete }: AddMilestoneFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState<Date>()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      formData.set("target_date", date ? format(date, "yyyy-MM-dd") : "")

      const result = await createMilestone(goalId, formData)

      if (result.success) {
        onComplete()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Input name="name" placeholder="Milestone name" required />
        </div>
        <div>
          <Textarea name="description" placeholder="Description (optional)" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input name="target_amount" type="number" step="0.01" min="0" placeholder="Target amount ($)" />
          </div>
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Target date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Milestone"}
          </Button>
        </div>
      </div>
    </form>
  )
}

