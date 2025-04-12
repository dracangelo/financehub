import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Emergency Fund",
  description: "Build and track your emergency savings.",
}

export default async function EmergencyFundPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Emergency Fund"
        text="Track and build your financial safety net."
        icon={<Shield className="h-6 w-6" />}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Emergency Fund Status</CardTitle>
            <CardDescription>Progress towards your emergency savings goal</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This feature is under development. Soon you'll be able to track your emergency fund here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

