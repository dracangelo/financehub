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
  // Provide fallback data in case of database errors
  const fallbackStats = {
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalMilestones: 0,
    completedMilestones: 0,
    totalSavings: 0,
    totalTargets: 0,
    progressPercentage: 0
  };
  
  // Wrap data fetching in try/catch to handle potential errors
  let goals: any[] = [];
  let stats = fallbackStats;
  
  try {
    const result = await getGoals();
    goals = result.goals || [];
  } catch (error) {
    console.error("Error fetching goals:", error);
    // Use empty array as fallback
  }

  try {
    const result = await getGoalStatistics();
    stats = result.stats || fallbackStats;
  } catch (error) {
    console.error("Error fetching goal statistics:", error);
    // Use fallback stats
  }

  // We've already extracted goals and stats in the try/catch blocks above

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Financial Goals"
        text="Set, track, and achieve your financial objectives."
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

