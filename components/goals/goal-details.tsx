"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { format } from "date-fns"
import { Calendar, DollarSign, Edit, Trash2, Plus, Pencil, MoreHorizontal } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { GoalForecastChart } from "./goal-forecast-chart"
import { AddMilestoneForm } from "./add-milestone-form"
import { EditMilestoneForm } from "./edit-milestone-form"
import { AddContributionForm } from "./add-contribution-form"
import { updateMilestoneStatus, deleteGoal, deleteMilestone } from "@/app/actions/goals"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface Goal {
  id: string
  name: string
  description?: string
  target_amount: number
  current_savings: number
  start_date: string
  target_date: string
  goal_type: string
  priority: number
  is_shared: boolean
  status: string
  image_url?: string
  milestones?: GoalMilestone[]
  funding_source?: string
  funding_amount?: number
  funding_frequency?: string
}

interface GoalMilestone {
  id: string
  goal_id: string
  name: string
  description?: string
  target_amount: number
  target_date: string
  is_completed: boolean
}

interface GoalDetailsProps {
  goal: Goal
}

export function GoalDetails({ goal }: GoalDetailsProps) {
  const router = useRouter()
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [isAddingContribution, setIsAddingContribution] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)

  // Calculate progress percentage
  const progressPercentage = 
    goal.target_amount && goal.target_amount > 0 ? 
      Math.min(100, ((goal.current_savings || 0) / goal.target_amount) * 100) : 0

  // Format dates with validation
  const formattedStartDate = goal.start_date && goal.start_date !== "null" && goal.start_date !== "undefined"
    ? format(new Date(goal.start_date), "MMMM d, yyyy")
    : "Not set"
    
  const formattedTargetDate = goal.target_date && goal.target_date !== "null" && goal.target_date !== "undefined"
    ? format(new Date(goal.target_date), "MMMM d, yyyy")
    : "Not set"

  // Format amounts
  const formattedTargetAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(goal.target_amount || 0)

  const formattedCurrentAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(goal.current_savings || 0)

  const handleMilestoneToggle = async (milestoneId: string, isCompleted: boolean) => {
    await updateMilestoneStatus(milestoneId, isCompleted)
  }

  const handleDeleteGoal = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteGoal(goal.id)
      if (result.success) {
        router.push("/goals")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Status badges
  const statusBadges: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> =
    {
      not_started: { variant: "outline", label: "Not Started" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "secondary", label: "Completed" },
      on_hold: { variant: "destructive", label: "On Hold" },
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{goal.name}</h1>
            <p className="text-muted-foreground">{goal.description}</p>
          </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/goals/${goal.id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the goal and all associated milestones.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteGoal} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Track your progress towards this goal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Progress value={progressPercentage} className="h-3" />
                  <div className="flex justify-between text-sm mt-2">
                    <span>{formattedCurrentAmount}</span>
                    <span>{formattedTargetAmount}</span>
                  </div>
                  <div className="text-center text-lg font-medium mt-2">{progressPercentage.toFixed(0)}% Complete</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Start Date</div>
                    <div className="font-medium">{formattedStartDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Target Date</div>
                    <div className="font-medium">{formattedTargetDate}</div>
                  </div>
                </div>

                {goal.funding_source && (
                  <div>
                    <div className="text-sm text-muted-foreground">Funding</div>
                    <div className="font-medium">
                      {goal.funding_amount && `$${goal.funding_amount}`}
                      {goal.funding_frequency && ` ${goal.funding_frequency}`}
                      from {goal.funding_source}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Goal Forecast</CardTitle>
              <CardDescription>Projected completion based on current progress</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <GoalForecastChart goal={goal} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Milestones</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsAddingMilestone(!isAddingMilestone)}>
                  {isAddingMilestone ? (
                    "Cancel"
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>Track key milestones for this goal</CardDescription>
            </CardHeader>
            <CardContent>
              {isAddingMilestone && (
                <div className="overflow-hidden mb-4">
                  <AddMilestoneForm goalId={goal.id} onComplete={() => setIsAddingMilestone(false)} />
                </div>
              )}

              <div className="space-y-4">
                {goal.milestones?.map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-2 p-2 rounded hover:bg-accent/50">
                    {editingMilestoneId === milestone.id ? (
                      <EditMilestoneForm
                        milestone={milestone}
                        onComplete={() => {
                          setEditingMilestoneId(null)
                          router.refresh()
                        }}
                      />
                    ) : (
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`milestone-${milestone.id}`}
                              checked={milestone.is_completed}
                              onCheckedChange={(checked) =>
                                handleMilestoneToggle(milestone.id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`milestone-${milestone.id}`}
                              className={cn(
                                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                                milestone.is_completed && "line-through text-muted-foreground"
                              )}
                            >
                              {milestone.name}
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setEditingMilestoneId(milestone.id)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={async () => {
                                    const result = await deleteMilestone(milestone.id)
                                    if (result.success) {
                                      toast({
                                        title: "Success",
                                        description: "Milestone deleted successfully",
                                      })
                                      router.refresh()
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>
                              {milestone.target_date && milestone.target_date !== "null" && milestone.target_date !== "undefined" 
                                ? format(new Date(milestone.target_date), "MMM d, yyyy")
                                : "No date set"}
                            </span>
                            {milestone.target_amount > 0 && (
                              <>
                                <DollarSign className="h-3 w-3 ml-2 mr-1" />
                                <span>
                                  {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                  }).format(milestone.target_amount)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(!goal.milestones || goal.milestones.length === 0) && (
                  <div className="text-center py-4 text-muted-foreground">
                    No milestones yet. Add some to track your progress!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Progress</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingContribution(!isAddingContribution)}
                >
                  {isAddingContribution ? (
                    "Cancel"
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contribution
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isAddingContribution && (
                <div className="mb-6">
                  <AddContributionForm
                    goalId={goal.id}
                    onComplete={() => setIsAddingContribution(false)}
                  />
                </div>
              )}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress ({Math.round(progressPercentage)}%)</span>
                    <span>{formattedCurrentAmount} of {formattedTargetAmount}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Priority</div>
                    <div className="font-medium capitalize">{goal.priority}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium">
                      <Badge variant={statusBadges[goal.status].variant}>{statusBadges[goal.status].label}</Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Sharing</div>
                    <div className="font-medium">{goal.is_shared ? "Public" : "Private"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  )
}
