"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { BudgetTemplateCard } from "./budget-template-card"
import { LIFE_EVENT_TEMPLATES } from "@/lib/budget/templates/life-events"
import { LIFESTYLE_TEMPLATES } from "@/lib/budget/templates/lifestyle"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export function BudgetTemplatesWrapper() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return

    setIsLoading(true)
    try {
      const template = [...LIFE_EVENT_TEMPLATES, ...LIFESTYLE_TEMPLATES].find(t => t.id === selectedTemplate)
      if (!template) throw new Error("Template not found")

      // TODO: Implement template application
      // For now, just show a success message
      toast({
        title: "Template Applied",
        description: `Successfully applied ${template.name} template.`,
      })
      
      setShowDialog(false)
      router.refresh()
    } catch (error) {
      console.error("Error applying template:", error)
      toast({
        title: "Error",
        description: "Failed to apply template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setShowDialog(true)
  }

  return (
    <>
      <ScrollArea className="h-[320px] px-1">
        <div className="grid grid-cols-1 gap-4 p-6">
          <Tabs defaultValue="life-events">
            <TabsList className="w-full">
              <TabsTrigger value="life-events" className="flex-1">Life Events</TabsTrigger>
              <TabsTrigger value="lifestyle" className="flex-1">Lifestyle</TabsTrigger>
            </TabsList>
            <TabsContent value="life-events">
              {LIFE_EVENT_TEMPLATES.slice(0, 3).map(template => (
                <BudgetTemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate === template.id}
                  onSelect={() => handleTemplateSelect(template.id)}
                />
              ))}
            </TabsContent>
            <TabsContent value="lifestyle">
              {LIFESTYLE_TEMPLATES.slice(0, 3).map(template => (
                <BudgetTemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate === template.id}
                  onSelect={() => handleTemplateSelect(template.id)}
                />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Budget Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply this template? This will create a new budget based on the selected template.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleApplyTemplate} disabled={isLoading}>Apply Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
