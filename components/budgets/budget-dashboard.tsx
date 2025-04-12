"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BudgetTemplateCard } from "./templates/budget-template-card"
import { InteractiveTreemap } from "./visualizations/interactive-treemap"
import { InteractiveWaterfall } from "./visualizations/interactive-waterfall"
import { BudgetProgressTracker } from "./progress/budget-progress-tracker"
import { BudgetChat } from "./shared/budget-chat"
import { BudgetSharingDialog } from "./shared/budget-sharing-dialog"
import { LIFE_EVENT_TEMPLATES } from "@/lib/budget/templates/life-events"
import { LIFESTYLE_TEMPLATES } from "@/lib/budget/templates/lifestyle"
import { Brain, LineChart, Share2, Sparkles, Target, Users } from "lucide-react"

interface BudgetDashboardProps {
  budgetId: string
  categories: any[]
  currentMembers: any[]
}

export function BudgetDashboard({ budgetId, categories, currentMembers }: BudgetDashboardProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Budget Allocation</CardTitle>
          <div className="flex items-center gap-2">
            <BudgetSharingDialog budgetId={budgetId} currentMembers={currentMembers} />
            <Button variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Set Goals
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="treemap" className="h-full">
          <TabsList className="px-6 mb-4">
            <TabsTrigger value="treemap">Treemap</TabsTrigger>
            <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
            <TabsTrigger value="variance">Variance</TabsTrigger>
          </TabsList>

          <TabsContent value="treemap" className="mt-0">
            <div className="px-6 pb-6">
              <InteractiveTreemap
                budget={{
                  categories,
                  totalBudget: categories.reduce((sum, cat) => sum + cat.amount, 0),
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="waterfall" className="mt-0">
            <div className="px-6 pb-6">
              <InteractiveWaterfall
                data={categories.map(cat => ({
                  category: cat.name || "Uncategorized",
                  budgeted: typeof cat.amount === "number" ? cat.amount : 0,
                  actual: typeof cat.current_amount === "number" ? cat.current_amount : 0,
                  variance: typeof cat.current_amount === "number" && typeof cat.amount === "number" 
                    ? cat.current_amount - cat.amount 
                    : 0,
                }))}
              />
            </div>
          </TabsContent>

          <TabsContent value="variance" className="mt-0">
            <div className="px-6 pb-6">
              <BudgetProgressTracker
                budgetId={budgetId}
                categories={categories}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
