"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriorityMatrix } from "./priority-matrix"
import { GoalNetworkDiagram } from "./goal-network-diagram"

interface GoalsOverviewProps {
  stats: {
    totalGoals: number
    activeGoals: number
    completedGoals: number
    totalMilestones: number
    completedMilestones: number
    totalSavings: number
    totalTargets: number
    progressPercentage: number
  }
}

export function GoalsOverview({ stats }: GoalsOverviewProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <div className="text-xs text-muted-foreground mt-1">{stats.completedGoals} completed</div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <div
                className="bg-green-500 h-2 rounded"
                style={{ width: `${(stats.completedGoals / stats.totalGoals) * 100}%` }}
              />
              <div
                className="bg-blue-500 h-2 rounded"
                style={{ width: `${(stats.activeGoals / stats.totalGoals) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{stats.activeGoals} active</span>
              <span>{stats.completedGoals} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.progressPercentage}%</div>
            <Progress value={stats.progressPercentage} className="h-2 mt-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Current: {formatCurrency(stats.totalSavings)}</span>
              <span>Target: {formatCurrency(stats.totalTargets)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMilestones}</div>
            <div className="text-xs text-muted-foreground mt-1">{stats.completedMilestones} completed</div>
            <Progress
              value={(stats.completedMilestones / stats.totalMilestones) * 100}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Savings Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSavings)}</div>
            <div className="text-xs text-muted-foreground mt-1">of {formatCurrency(stats.totalTargets)}</div>
            <Progress
              value={(stats.totalSavings / stats.totalTargets) * 100}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="priority-matrix">
        <TabsList>
          <TabsTrigger value="priority-matrix">Priority Matrix</TabsTrigger>
          <TabsTrigger value="goal-network">Goal Network</TabsTrigger>
        </TabsList>
        <TabsContent value="priority-matrix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Goal Priority Matrix</CardTitle>
              <CardDescription>Visualize your goals based on urgency and importance</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <PriorityMatrix />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="goal-network" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Goal Network Diagram</CardTitle>
              <CardDescription>See how your financial goals are interconnected</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <GoalNetworkDiagram />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

