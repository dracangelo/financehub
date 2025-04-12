import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { TaxPlanningDashboard } from "@/components/tax/tax-planning-dashboard"
import { TaxBreadcrumb } from "@/components/tax/tax-breadcrumb"
import { Calculator } from "lucide-react"

export const metadata: Metadata = {
  title: "Tax Planner",
  description: "Plan and optimize your tax strategy.",
}

export default async function TaxPlannerPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Tax Planner"
        text="Plan and optimize your tax strategy and maximize your returns."
        icon={<Calculator className="h-6 w-6" />}
      />
      <TaxBreadcrumb />
      <TaxPlanningDashboard />
    </DashboardShell>
  )
}

