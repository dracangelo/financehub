import { Suspense } from "react"
import { WidgetLayout } from "@/components/dashboard/widget-layout"
import { FinancialCalendar } from "@/components/dashboard/financial-calendar"

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Financial Calendar</h1>

      <Suspense fallback={<div>Loading calendar...</div>}>
        <WidgetLayout title="Monthly Financial Overview">
          <FinancialCalendar />
        </WidgetLayout>
      </Suspense>
    </div>
  )
}

