"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// Types for our goal planning system based on goals.sql schema
export type GoalStatus = 'active' | 'paused' | 'achieved' | 'cancelled'
export type RoundupType = 'nearest_dollar' | 'fixed_amount' | 'percentage'

export type Goal = {
  id: string
  user_id: string
  name: string
  description?: string
  image_url?: string
  target_amount: number
  current_amount: number
  currency: string
  status: GoalStatus
  priority: number
  start_date: Date
  end_date?: Date
  progress: number
  created_at: string
  updated_at: string
}

export type GoalTemplate = {
  id: string
  name: string
  description?: string
  recommended_monthly_saving?: number
  duration_months?: number
  default_image_url?: string
  created_at: string
}

export type GoalMilestone = {
  id: string
  goal_id: string
  name: string
  description?: string
  target_amount: number
  is_achieved: boolean
  achieved_at?: string
  created_at: string
  updated_at: string
}

export type GoalContribution = {
  id: string
  goal_id: string
  user_id: string
  amount: number
  contribution_date: Date
  note?: string
  created_at: string
}

export type GoalRoundup = {
  id: string
  user_id: string
  goal_id: string
  is_enabled: boolean
  roundup_type: RoundupType
  fixed_amount?: number
  percentage?: number
  created_at: string
}

// Get all goals for the current user with milestones and contributions
export async function getGoals() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Not authenticated", goals: [] }
    }

    const supabase = await createClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { error: "Database connection error", goals: [] }
    }

    try {
      // Use the user_goal_summary view defined in goals.sql
      const { data: goals, error } = await supabase
        .from("financial_goals")
        .select(`
          *,
          milestones:goal_milestones(*),
          contributions:goal_contributions(*)
        `)
        .eq("user_id", user.id)
        .order("priority", { ascending: true })
        .order("end_date", { ascending: true })

      if (error) {
        // Check if the error is due to missing tables (common during development)
        if (error.code === "42P01") { // undefined_table
          console.log("Goals tables not yet created, returning empty array")
          return { error: null, goals: [] }
        }
        
        console.error("Error fetching goals:", error)
        return { error: error.message, goals: [] }
      }

      return { goals, error: null }
    } catch (innerError) {
      console.error("Error in getGoals inner try/catch:", innerError)
      return { error: "Failed to fetch goals", goals: [] }
    }
  } catch (error) {
    console.error("Error in getGoals:", error)
    return { error: "Failed to fetch goals", goals: [] }
  }
}

// Get goal statistics
export async function getGoalStatistics() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Not authenticated", stats: null }
    }

    const supabase = await createClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { error: "Database connection error", stats: null }
    }

    // Default stats in case of errors
    const defaultStats = {
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      totalMilestones: 0,
      completedMilestones: 0,
      totalSavings: 0,
      totalTargets: 0,
      progressPercentage: 0,
    }

    try {
      // Get all goals
      const { data: goals, error: goalsError } = await supabase
        .from("financial_goals")
        .select("*")
        .eq("user_id", user.id)

      if (goalsError) {
        // Check if the error is due to missing tables (common during development)
        if (goalsError.code === "42P01") { // undefined_table
          console.log("Goals tables not yet created, returning default stats")
          return { error: null, stats: defaultStats }
        }
        
        console.error("Error fetching goals for stats:", goalsError)
        return { error: goalsError.message, stats: defaultStats }
      }

    // Get all milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from("goal_milestones")
      .select("*")
      .in(
        "goal_id",
        goals?.map((g) => g.id) || []
      )

    if (milestonesError) {
      // Check if the error is due to missing tables
      if (milestonesError.code === "42P01") { // undefined_table
        console.log("Milestone table not yet created, continuing with empty milestones")
        return { 
          stats: {
            ...defaultStats,
            totalGoals: goals?.length || 0,
            activeGoals: goals?.filter((g) => g.status === 'active').length || 0,
            completedGoals: goals?.filter((g) => g.status === 'achieved').length || 0,
            totalSavings: goals?.reduce((sum, g) => sum + (g.current_amount || 0), 0) || 0,
            totalTargets: goals?.reduce((sum, g) => sum + (g.target_amount || 0), 0) || 0,
            progressPercentage: goals?.reduce((sum, g) => sum + (g.progress || 0), 0) / (goals?.length || 1) || 0
          }, 
          error: null 
        }
      }
      
      console.error("Error fetching milestones for stats:", milestonesError)
      return { error: milestonesError.message, stats: defaultStats }
    }

    // Calculate statistics
    const stats = {
      totalGoals: goals?.length || 0,
      activeGoals: goals?.filter((g) => g.status === 'active').length || 0,
      completedGoals: goals?.filter((g) => g.status === 'achieved').length || 0,
      totalMilestones: milestones?.length || 0,
      completedMilestones: milestones?.filter((m) => m.is_achieved).length || 0,
      totalSavings: goals?.reduce((sum, g) => sum + (g.current_amount || 0), 0) || 0,
      totalTargets: goals?.reduce((sum, g) => sum + (g.target_amount || 0), 0) || 0,
      progressPercentage: goals?.reduce((sum, g) => sum + (g.progress || 0), 0) / (goals?.length || 1) || 0,
    }

    return { stats, error: null }
    } catch (error) {
      console.error("Error in getGoalStatistics inner try/catch:", error)
      return { error: "Failed to fetch goal statistics", stats: defaultStats }
    }
  } catch (error) {
    console.error("Error in getGoalStatistics outer try/catch:", error)
    return { error: "Failed to fetch goal statistics", stats: {
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      totalMilestones: 0,
      completedMilestones: 0,
      totalSavings: 0,
      totalTargets: 0,
      progressPercentage: 0,
    } }
  }
}

// Get a single goal by ID
export async function getGoalById(goalId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Not authenticated", goal: null }
    }

    const supabase = await createClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { error: "Database connection error", goal: null }
    }

    try {
      const { data: goal, error } = await supabase
        .from("financial_goals")
        .select(`
          *,
          milestones:goal_milestones(*),
          contributions:goal_contributions(*)
        `)
        .eq("id", goalId)
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching goal:", error)
        return { error: error.message, goal: null }
      }

      // Fetch goal roundups if they exist
      const { data: roundups } = await supabase
        .from("goal_roundups")
        .select("*")
        .eq("goal_id", goalId)
        .maybeSingle()

      // Fetch goal templates if they exist
      const { data: templates } = await supabase
        .from("goal_templates")
        .select("*")
        .maybeSingle()

      // Return the goal with all related data
      if (goal) {
        return {
          goal: {
            ...goal,
            roundup: roundups || null,
            template: templates || null,
          },
          error: null,
        }
      }

      return { goal: null, error: "Goal not found" }
    } catch (innerError) {
      console.error("Error in getGoalById inner try/catch:", innerError)
      return { error: "Failed to fetch goal", goal: null }
    }
  } catch (error) {
    console.error("Error in getGoalById:", error)
    return { error: "Failed to fetch goal", goal: null }
  }
}

// Create a new goal with optional milestones
export async function createGoal(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Not authenticated", goal: null }
    }

    const supabase = await createClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { error: "Database connection error", goal: null }
    }

    // Extract form data
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const targetAmount = parseFloat(formData.get("targetAmount") as string)
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const imageUrl = formData.get("imageUrl") as string
    const priority = parseInt(formData.get("priority") as string) || 1
    const currency = formData.get("currency") as string || "USD"

    // Validate required fields
    if (!name || !targetAmount || isNaN(targetAmount)) {
      return { error: "Name and target amount are required", goal: null }
    }

    try {
      // Create the goal
      const { data: goal, error } = await supabase
        .from("financial_goals")
        .insert({
          user_id: user.id,
          name,
          description,
          target_amount: targetAmount,
          current_amount: 0,
          start_date: startDate || new Date().toISOString(),
          end_date: endDate || null,
          image_url: imageUrl || null,
          priority,
          currency: currency,
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating goal:", error)
        return { error: error.message, goal: null }
      }

      // Create milestones if provided
      const milestonesData = formData.get("milestones") as string
      if (milestonesData) {
        try {
          const milestones = JSON.parse(milestonesData)
          if (Array.isArray(milestones) && milestones.length > 0) {
            const milestonesToInsert = milestones.map((m: any) => ({
              goal_id: goal.id,
              name: m.name,
              description: m.description || null,
              target_amount: m.targetAmount,
              is_achieved: false,
            }))

            await supabase.from("goal_milestones").insert(milestonesToInsert)
          }
        } catch (parseError) {
          console.error("Error parsing milestones:", parseError)
          // Continue even if milestones parsing fails
        }
      }

      revalidatePath("/goals")
      return { goal, error: null }
    } catch (innerError) {
      console.error("Error in createGoal inner try/catch:", innerError)
      return { error: "Failed to create goal", goal: null }
    }
  } catch (error) {
    console.error("Error in createGoal:", error)
    return { error: "Failed to create goal", goal: null }
  }
}

// Add a contribution to a goal
export async function addGoalContribution(goalId: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Not authenticated", success: false }
    }

    const supabase = await createClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { error: "Database connection error", success: false }
    }

    // Extract form data
    const amount = Number.parseFloat(formData.get("amount") as string)
    const note = formData.get("note") as string
    const contributionDate = formData.get("contributionDate") as string || new Date().toISOString().split('T')[0]

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return { error: "Valid contribution amount is required", success: false }
    }

    // Check if goal exists and belongs to user
    const { data: goal, error: goalError } = await supabase
      .from("financial_goals")
      .select("*")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single()

    if (goalError) {
      console.error("Error checking goal:", goalError)
      return { error: "Goal not found or access denied", success: false }
    }

    // Create contribution record
    const { data: contribution, error } = await supabase
      .from("goal_contributions")
      .insert({
        goal_id: goalId,
        user_id: user.id,
        amount,
        note,
        contribution_date: contributionDate,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating contribution:", error)
      return { error: error.message, success: false }
    }

    // The trigger defined in goals.sql will automatically update the goal's current_amount
    // We don't need to manually update it here

    revalidatePath(`/goals/${goalId}`)
    revalidatePath("/goals")
    return { success: true, contribution, error: null }
  } catch (error) {
    console.error("Error in addGoalContribution:", error)
    return { error: "Failed to process contribution", success: false }
  }
}
