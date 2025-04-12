import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getGoals, getGoalStatistics } from "@/app/actions/goals"
import { GoalsList } from "@/components/goals/goals-list"
import { GoalsOverview } from "@/components/goals/goals-overview"
import { Button } from "@/components/ui/button"
import { Plus, Target } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Financial Goals",
  description: "Set and track your financial goals.",
}

export default async function GoalsPage() {
  const { goals, error: goalsError } = await getGoals()
  const { stats, error: statsError } = await getGoalStatistics()

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Financial Goals"
        text="Set, track, and achieve your financial objectives."
        icon={<Target className="h-6 w-6" />}
      >
        <Button asChild>
          <Link href="/goals/new">
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Link>
        </Button>
      </DashboardHeader>

      {stats && <GoalsOverview stats={stats} />}

      <GoalsList goals={goals || []} />
    </DashboardShell>
  )
}

