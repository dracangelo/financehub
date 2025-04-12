"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Check, Info } from "lucide-react"
import type { BudgetTemplate } from "@/types/budget"

interface BudgetTemplateCardProps {
  template: BudgetTemplate
  isSelected: boolean
  onSelect: () => void
}

export function BudgetTemplateCard({ template, isSelected, onSelect }: BudgetTemplateCardProps) {
  return (
    <Card
      className={`relative cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{template.name}</CardTitle>
            <CardDescription className="text-sm">{template.description}</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{template.type}</Badge>
            <Badge variant="outline">{template.timeline}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Income Range: ${template.recommendedIncome.min.toLocaleString()} - $
            {template.recommendedIncome.max.toLocaleString()}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
