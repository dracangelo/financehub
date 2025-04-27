"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// Types for our goal planning system
export type GoalType = 'education' | 'retirement' | 'home' | 'vacation' | 'emergency' | 'custom'
export type FundingStrategy = 'round_up' | 'income_split' | 'manual'
export type UrgencyLevel = 'low' | 'medium' | 'high'
export type ImpactLevel = 'low' | 'medium' | 'high'
export type RelationType = 'precedes' | 'depends_on' | 'enhances'
export type AccessLevel = 'view' | 'comment' | 'collaborate'

export type Goal = {
  id: string
  user_id: string
  template_id?: string
  name: string
  description?: string
  target_amount: number
  current_savings: number
  start_date?: Date
  target_date?: Date
  goal_type: GoalType
  image_url?: string
  priority: number
  funding_strategy?: FundingStrategy
  is_shared: boolean
  is_achieved: boolean
  created_at: string
  updated_at: string
}

export type GoalTemplate = {
  id: string
  name: string
  description?: string
  recommended_strategy?: string
  estimated_duration_months?: number
  default_milestones?: any
  goal_type: GoalType
  created_at: string
}

export type GoalMilestone = {
  id: string
  goal_id: string
  name: string
  description?: string
  amount_target: number
  target_date?: string
  achieved: boolean
  achieved_at?: string
  celebration_triggered: boolean
  image_url?: string
  created_at: string
}

export type GoalPriority = {
  id: string
  user_id: string
  goal_id: string
  priority_score: number
  urgency_level: UrgencyLevel
  impact_level: ImpactLevel
  notes?: string
  created_at: string
}

export type GoalRelationship = {
  id: string
  user_id: string
  parent_goal_id: string
  child_goal_id: string
  relationship_type: RelationType
  created_at: string
}

export type GoalShare = {
  id: string
  goal_id: string
  shared_with_email: string
  shared_message?: string
  access_level: AccessLevel
  invited_at: string
}

export type GoalAchievement = {
  id: string
  user_id: string
  goal_id: string
  milestone_id?: string
  description: string
  achieved_at: string
  is_shared: boolean
  celebration_type?: string
  created_at: string
}

// Get all goals for the current user with relationships and milestones
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
      const { data: goals, error } = await supabase
        .from("user_goals")
        .select(`
          *,
          template:goal_templates(*),
          milestones:goal_milestones(*),
          priority_matrix:goal_priority_matrix(*),
          parent_relationships:goal_relationships!goal_relationships_child_goal_id_fkey(*),
          child_relationships:goal_relationships!goal_relationships_parent_goal_id_fkey(*),
          shares:goal_shares(*),
          achievements:goal_achievements(*)
        `)
        .eq("user_id", user.id)
        .order("priority", { ascending: true })
        .order("target_date", { ascending: true })

      if (error) {
        // Check if the error is due to missing tables (common during development)
        if (error.code === "42P01") { // undefined_table
          console.log("Goals tables not yet created, returning empty array")
          return { error: null, goals: [] }
        }
        
        console.error("Error fetching goals:", error)
        return { error: error.message, goals: [] }
      }

      // Calculate status for each goal
      const goalsWithStatus = goals?.map((goal) => {
        let status: "not_started" | "in_progress" | "completed" | "on_hold" = "not_started"

        if (goal.is_achieved) {
          status = "completed"
        } else if (goal.current_savings > 0) {
          status = "in_progress"
        }

        return { ...goal, status }
      })

      return { goals: goalsWithStatus, error: null }
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
        .from("user_goals")
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
            activeGoals: goals?.filter((g) => !g.is_achieved).length || 0,
            completedGoals: goals?.filter((g) => g.is_achieved).length || 0,
            totalSavings: goals?.reduce((sum, g) => sum + (g.current_savings || 0), 0) || 0,
            totalTargets: goals?.reduce((sum, g) => sum + (g.target_amount || 0), 0) || 0,
            progressPercentage: calculateProgressPercentage(goals || [])
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
      activeGoals: goals?.filter((g) => !g.is_achieved).length || 0,
      completedGoals: goals?.filter((g) => g.is_achieved).length || 0,
      totalMilestones: milestones?.length || 0,
      completedMilestones: milestones?.filter((m) => m.achieved).length || 0,
      totalSavings: goals?.reduce((sum, g) => sum + (g.current_savings || 0), 0) || 0,
      totalTargets: goals?.reduce((sum, g) => sum + (g.target_amount || 0), 0) || 0,
      progressPercentage: calculateProgressPercentage(goals || []),
    }
    
    // Helper function to safely calculate progress percentage
    function calculateProgressPercentage(goals: any[]) {
      if (!goals || goals.length === 0) return 0;
      
      const totalSavings = goals.reduce((sum, g) => sum + (g.current_savings || 0), 0);
      const totalTargets = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
      
      if (totalTargets === 0) return 0;
      
      return Math.round((totalSavings / totalTargets) * 100);
    }

    return { stats, error: null }
    } catch (error) {
      console.error("Error in getGoalStatistics inner try/catch:", error)
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
        .from("user_goals")
        .select(`
          *,
          milestones:goal_milestones(*)
        `)
        .eq("id", goalId)
        .eq("user_id", user.id)
        .single()

      if (error) {
        // Check if the error is due to missing tables (common during development)
        if (error.code === "42P01") { // undefined_table
          console.log("Goals tables not yet created, returning empty object")
          return { error: null, goal: null }
        }
        
        console.error("Error fetching goal:", error)
        return { error: error.message, goal: null }
      }

      // Calculate status for the goal
      if (goal) {
        let status: "not_started" | "in_progress" | "completed" | "on_hold" = "not_started"

        if (goal.is_achieved) {
          status = "completed"
        } else if (goal.current_savings > 0) {
          status = "in_progress"
        }

        // Now fetch additional relationships in separate queries to avoid join issues
        try {
          const { data: templates } = await supabase
            .from("goal_templates")
            .select("*")
            .eq("id", goal.template_id)
            .maybeSingle()

          const { data: priorityMatrix } = await supabase
            .from("goal_priority_matrix")
            .select("*")
            .eq("goal_id", goalId)
            .maybeSingle()

          const { data: parentRelationships } = await supabase
            .from("goal_relationships")
            .select("*")
            .eq("child_goal_id", goalId)

          const { data: childRelationships } = await supabase
            .from("goal_relationships")
            .select("*")
            .eq("parent_goal_id", goalId)

          const { data: shares } = await supabase
            .from("goal_shares")
            .select("*")
            .eq("goal_id", goalId)

          const { data: achievements } = await supabase
            .from("goal_achievements")
            .select("*")
            .eq("goal_id", goalId)

          const enrichedGoal = { 
            ...goal, 
            status,
            template: templates || null,
            priority_matrix: priorityMatrix || null,
            parent_relationships: parentRelationships || [],
            child_relationships: childRelationships || [],
            shares: shares || [],
            achievements: achievements || []
          }

          return { goal: enrichedGoal, error: null }
        } catch (relationshipError) {
          console.log("Error fetching relationships, returning goal with basic data:", relationshipError)
          return { goal: { ...goal, status }, error: null }
        }
      }

      return { goal: null, error: null }
    } catch (innerError) {
      console.error("Error in getGoalById inner try/catch:", innerError)
      return { error: "Failed to fetch goal details", goal: null }
    }
  } catch (error) {
    console.error("Error in getGoalById:", error)
    return { error: "Failed to fetch goal", goal: null }
  }
}

// Create a new goal with optional template and milestones
export async function createGoal(formData: FormData) {
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

    const templateId = formData.get("template_id") as string
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const targetAmount = Number.parseFloat(formData.get("target_amount") as string)
    const startDate = formData.get("start_date") as string
    const targetDate = formData.get("target_date") as string
    const goalType = formData.get("goal_type") as GoalType
    const imageUrl = formData.get("image_url") as string
    const priority = Number.parseInt(formData.get("priority") as string)
    const fundingStrategy = formData.get("funding_strategy") as FundingStrategy
    const isShared = formData.get("is_shared") === "true"

    // Start a transaction
    const { data: goal, error: goalError } = await supabase
      .from("user_goals")
      .insert({
        user_id: user.id,
        template_id: templateId || null,
        name,
        description,
        target_amount: targetAmount,
        current_savings: 0,
        start_date: startDate ? new Date(startDate) : null,
        target_date: targetDate ? new Date(targetDate) : null,
        goal_type: goalType,
        image_url: imageUrl || null,
        priority,
        funding_strategy: fundingStrategy || null,
        is_shared: isShared,
        is_achieved: false,
      })
      .select()
      .single()

    if (goalError) {
      console.error("Error creating goal:", goalError)
      return { error: goalError.message, success: false }
    }

    // If using a template, create milestones from template
    if (templateId) {
      const { data: template } = await supabase
        .from("goal_templates")
        .select("default_milestones")
        .eq("id", templateId)
        .single()

      if (template?.default_milestones) {
        const milestones = template.default_milestones.map((milestone: any) => ({
          goal_id: goal.id,
          name: milestone.name,
          description: milestone.description,
          amount_target: (targetAmount * milestone.percentage) / 100,
          achieved: false,
          celebration_triggered: false,
          image_url: milestone.image_url,
        }))

        const { error: milestoneError } = await supabase.from("goal_milestones").insert(milestones)

        if (milestoneError) {
          console.error("Error creating milestones:", milestoneError)
        }
      }
    }

    revalidatePath("/goals")
    return { success: true, goal, error: null }
  } catch (error) {
    console.error("Error in createGoal:", error)
    return { error: "Failed to create goal", success: false }
  }
}

// Update goal priority matrix
export async function updateGoalPriority(goalId: string, formData: FormData) {
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

    // Check if goal belongs to user
    const { data: goal, error: goalError } = await supabase
      .from("user_goals")
      .select("user_id")
      .eq("id", goalId)
      .single()

    if (goalError || !goal) {
      return { error: "Goal not found", success: false }
    }

    if (goal.user_id !== user.id) {
      return { error: "Not authorized", success: false }
    }

    const priorityScore = Number.parseFloat(formData.get("priority_score") as string)
    const urgencyLevel = formData.get("urgency_level") as UrgencyLevel
    const impactLevel = formData.get("impact_level") as ImpactLevel
    const notes = formData.get("notes") as string

    // Update or create priority matrix entry
    const { data: priority, error } = await supabase
      .from("goal_priority_matrix")
      .upsert({
        user_id: user.id,
        goal_id: goalId,
        priority_score: priorityScore,
        urgency_level: urgencyLevel,
        impact_level: impactLevel,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error updating priority:", error)
      return { error: error.message, success: false }
    }

    // Update goal priority
    await supabase
      .from("user_goals")
      .update({ priority: Math.round(priorityScore) })
      .eq("id", goalId)

    revalidatePath(`/goals/${goalId}`)
    return { success: true, priority, error: null }
  } catch (error) {
    console.error("Error in updateGoalPriority:", error)
    return { error: "Failed to update priority", success: false }
  }
}

// Create or update goal relationship
export async function updateGoalRelationship(
  parentGoalId: string,
  childGoalId: string,
  formData: FormData
) {
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

    // Check if both goals belong to user
    const { data: goals, error: goalsError } = await supabase
      .from("user_goals")
      .select("id, user_id")
      .in("id", [parentGoalId, childGoalId])

    if (goalsError || !goals || goals.length !== 2) {
      return { error: "Goals not found", success: false }
    }

    if (!goals.every((g) => g.user_id === user.id)) {
      return { error: "Not authorized", success: false }
    }

    const relationshipType = formData.get("relationship_type") as RelationType

    // Create or update relationship
    const { data: relationship, error } = await supabase
      .from("goal_relationships")
      .upsert({
        user_id: user.id,
        parent_goal_id: parentGoalId,
        child_goal_id: childGoalId,
        relationship_type: relationshipType,
      })
      .select()
      .single()

    if (error) {
      console.error("Error updating relationship:", error)
      return { error: error.message, success: false }
    }

    revalidatePath(`/goals/${parentGoalId}`)
    revalidatePath(`/goals/${childGoalId}`)
    return { success: true, relationship, error: null }
  } catch (error) {
    console.error("Error in updateGoalRelationship:", error)
    return { error: "Failed to update relationship", success: false }
  }
}

// Configure round-up settings
export async function configureRoundUp(goalId: string, formData: FormData) {
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

    // Check if goal belongs to user
    const { data: goal, error: goalError } = await supabase
      .from("user_goals")
      .select("user_id")
      .eq("id", goalId)
      .single()

    if (goalError || !goal) {
      return { error: "Goal not found", success: false }
    }

    if (goal.user_id !== user.id) {
      return { error: "Not authorized", success: false }
    }

    const isEnabled = formData.get("is_enabled") === "true"
    const roundingBase = Number.parseFloat(formData.get("rounding_base") as string)

    // Update or create round-up settings
    const { data: settings, error } = await supabase
      .from("round_up_settings")
      .upsert({
        user_id: user.id,
        funding_goal_id: goalId,
        is_enabled: isEnabled,
        rounding_base: roundingBase,
      })
      .select()
      .single()

    if (error) {
      console.error("Error configuring round-up:", error)
      return { error: error.message, success: false }
    }

    // Update goal funding strategy
    if (isEnabled) {
      await supabase
        .from("user_goals")
        .update({ funding_strategy: "round_up" })
        .eq("id", goalId)
    }

    revalidatePath(`/goals/${goalId}`)
    return { success: true, settings, error: null }
  } catch (error) {
    console.error("Error in configureRoundUp:", error)
    return { error: "Failed to configure round-up", success: false }
  }
}

// Configure income split rules
export async function configureIncomeSplit(goalId: string, formData: FormData) {
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

    // Check if goal belongs to user
    const { data: goal, error: goalError } = await supabase
      .from("user_goals")
      .select("user_id")
      .eq("id", goalId)
      .single()

    if (goalError || !goal) {
      return { error: "Goal not found", success: false }
    }

    if (goal.user_id !== user.id) {
      return { error: "Not authorized", success: false }
    }

    const splitPercentage = Number.parseFloat(formData.get("split_percentage") as string)
    const isActive = formData.get("is_active") === "true"

    // Update or create income split rule
    const { data: rule, error } = await supabase
      .from("income_split_rules")
      .upsert({
        user_id: user.id,
        goal_id: goalId,
        split_percentage: splitPercentage,
        is_active: isActive,
      })
      .select()
      .single()

    if (error) {
      console.error("Error configuring income split:", error)
      return { error: error.message, success: false }
    }

    // Update goal funding strategy
    if (isActive) {
      await supabase
        .from("user_goals")
        .update({ funding_strategy: "income_split" })
        .eq("id", goalId)
    }

    revalidatePath(`/goals/${goalId}`)
    return { success: true, rule, error: null }
  } catch (error) {
    console.error("Error in configureIncomeSplit:", error)
    return { error: "Failed to configure income split", success: false }
  }
}

// Delete a goal
export async function deleteGoal(goalId: string) {
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

    // First check if the goal belongs to the user
    const { data: existingGoal, error: fetchError } = await supabase
      .from("user_goals")
      .select("user_id")
      .eq("id", goalId)
      .single()

    if (fetchError) {
      console.error("Error fetching goal:", fetchError)
      return { error: "Goal not found", success: false }
    }
    
    if (!existingGoal) {
      return { error: "Goal not found", success: false }
    }

    if (existingGoal.user_id !== user.id) {
      return { error: "Not authorized", success: false }
    }

    // First delete related milestones to avoid foreign key constraints
    const { error: milestonesDeleteError } = await supabase
      .from("goal_milestones")
      .delete()
      .eq("goal_id", goalId)
    
    if (milestonesDeleteError) {
      console.error("Error deleting goal milestones:", milestonesDeleteError)
      // Continue with goal deletion even if milestone deletion fails
    }

    // Delete the goal
    const { error } = await supabase
      .from("user_goals")
      .delete()
      .eq("id", goalId)

    if (error) {
      console.error("Error deleting goal:", error)
      return { error: error.message, success: false }
    }

    revalidatePath("/goals")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error in deleteGoal:", error)
    return { error: "Failed to delete goal", success: false }
  }
}

// Create a milestone for a goal
export async function createMilestone(goalId: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Not authenticated", success: false }
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const targetAmount = Number.parseFloat(formData.get("target_amount") as string) || 0
    // We'll handle the target_date separately to avoid schema errors

    const supabase = await createClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { error: "Database connection error", success: false }
    }

    // First check if the goal belongs to the user
    const { data: existingGoal, error: fetchError } = await supabase
      .from("user_goals")
      .select("user_id")
      .eq("id", goalId)
      .single()

    if (fetchError || !existingGoal) {
      return { error: "Goal not found", success: false }
    }

    if (existingGoal.user_id !== user.id) {
      return { error: "Not authorized", success: false }
    }

    const { data: milestone, error } = await supabase
      .from("goal_milestones")
      .insert({
        goal_id: goalId,
        name,
        description,
        amount_target: targetAmount,
        achieved: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating milestone:", error)
      return { error: error.message, success: false }
    }

    revalidatePath(`/goals/${goalId}`)
    return { success: true, milestone, error: null }
  } catch (error) {
    console.error("Error in createMilestone:", error)
    return { error: "Failed to create milestone", success: false }
  }
}

// Update milestone status
export async function deleteMilestone(milestoneId: string) {
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

    // Get milestone to check ownership
    const { data: milestone, error: fetchError } = await supabase
      .from("goal_milestones")
      .select("goal_id")
      .eq("id", milestoneId)
      .single()

    if (fetchError) {
      console.error("Error fetching milestone:", fetchError)
      return { error: "Milestone not found", success: false }
    }
    
    if (!milestone) {
      return { error: "Milestone not found", success: false }
    }

    // Check if user owns the goal
    const { data: goal, error: goalError } = await supabase
      .from("user_goals")
      .select("user_id")
      .eq("id", milestone.goal_id)
      .single()

    if (goalError) {
      console.error("Error fetching goal:", goalError)
      return { error: "Goal not found", success: false }
    }
    
    if (!goal) {
      return { error: "Goal not found", success: false }
    }

    if (goal.user_id !== user.id) {
      return { error: "Not authorized", success: false }
    }

    // Store the goal ID before deleting the milestone
    const goalId = milestone.goal_id

    // Delete the milestone
    const { error: deleteError } = await supabase
      .from("goal_milestones")
      .delete()
      .eq("id", milestoneId)

    if (deleteError) {
      console.error("Error deleting milestone:", deleteError)
      return { error: deleteError.message, success: false }
    }

    // Revalidate the path with the stored goal ID
    revalidatePath(`/goals/${goalId}`)
    return { success: true }
  } catch (error) {
    console.error("Error in deleteMilestone:", error)
    return { error: "Failed to delete milestone", success: false }
  }
}

export async function updateMilestone(milestoneId: string, formData: FormData) {
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

    // Get milestone to check ownership
    const { data: milestone, error: fetchError } = await supabase
      .from("goal_milestones")
      .select("goal_id")
      .eq("id", milestoneId)
      .single()

    if (fetchError) {
      console.error("Error fetching milestone:", fetchError)
      return { error: "Milestone not found", success: false }
    }
    
    if (!milestone) {
      return { error: "Milestone not found", success: false }
    }

    // Check if user owns the goal
    const { data: goal, error: goalError } = await supabase
      .from("user_goals")
      .select("user_id")
      .eq("id", milestone.goal_id)
      .single()

    if (goalError) {
      console.error("Error fetching goal:", goalError)
      return { error: "Goal not found", success: false }
    }
    
    if (!goal) {
      return { error: "Goal not found", success: false }
    }

    if (goal.user_id !== user.id) {
      return { error: "Not authorized", success: false }
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const targetAmount = formData.get("target_amount") ? 
      Number(formData.get("target_amount")) : undefined
    // We'll handle target_date separately to avoid schema errors

    if (!name) {
      return { error: "Missing required fields", success: false }
    }

    const { data: updatedMilestone, error: updateError } = await supabase
      .from("goal_milestones")
      .update({
        name,
        description,
        amount_target: targetAmount,
      })
      .eq("id", milestoneId)
      .select()
      .single()

    if (updateError) {
      return { error: updateError.message, success: false }
    }

    revalidatePath(`/goals/${milestone.goal_id}`)
    return { success: true, milestone: updatedMilestone }
  } catch (error) {
    console.error("Error in updateMilestone:", error)
    return { error: "Failed to update milestone", success: false }
  }
}

export async function updateMilestoneStatus(milestoneId: string, isCompleted: boolean) {
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

    // First check if the milestone's goal belongs to the user
    const { data: milestone, error: fetchError } = await supabase
      .from("goal_milestones")
      .select("goal_id")
      .eq("id", milestoneId)
      .single()

    if (fetchError || !milestone) {
      return { error: "Milestone not found", success: false }
    }

    const { data: goal, error: goalError } = await supabase
      .from("user_goals")
      .select("user_id")
      .eq("id", milestone.goal_id)
      .single()

    if (goalError || !goal) {
      return { error: "Goal not found", success: false }
    }

    if (goal.user_id !== user.id) {
      return { error: "Not authorized", success: false }
    }

    const { error } = await supabase
      .from("goal_milestones")
      .update({
        achieved: isCompleted,
        achieved_at: isCompleted ? new Date().toISOString() : null,
        celebration_triggered: false,
      })
      .eq("id", milestoneId)

    if (error) {
      console.error("Error updating milestone:", error)
      return { error: error.message, success: false }
    }

    revalidatePath(`/goals/${milestone.goal_id}`)
    return { success: true, error: null }
  } catch (error) {
    console.error("Error in updateMilestoneStatus:", error)
    return { error: "Failed to update milestone", success: false }
  }
}

// Create a goal achievement
export async function createAchievement(goalId: string, formData: FormData) {
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

    // Check if goal belongs to user
    const { data: goal, error: goalError } = await supabase
      .from("user_goals")
      .select("user_id")
      .eq("id", goalId)
      .single()

    if (goalError || !goal) {
      return { error: "Goal not found", success: false }
    }

    if (goal.user_id !== user.id) {
      return { error: "Not authorized", success: false }
    }

    const description = formData.get("description") as string
    const milestoneId = formData.get("milestone_id") as string
    const isShared = formData.get("is_shared") === "true"
    const celebrationType = formData.get("celebration_type") as string

    const { data: achievement, error } = await supabase
      .from("goal_achievements")
      .insert({
        user_id: user.id,
        goal_id: goalId,
        milestone_id: milestoneId || null,
        description,
        achieved_at: new Date().toISOString(),
        is_shared: isShared,
        celebration_type: celebrationType || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating achievement:", error)
      return { error: error.message, success: false }
    }

    // Update goal status if this is a goal completion achievement
    if (!milestoneId) {
      await supabase
        .from("user_goals")
        .update({ is_achieved: true })
        .eq("id", goalId)
    }

    revalidatePath(`/goals/${goalId}`)
    return { success: true, achievement, error: null }
  } catch (error) {
    console.error("Error in createAchievement:", error)
    return { error: "Failed to create achievement", success: false }
  }
}

// Add a contribution to a goal
export async function addGoalContribution(goalId: string, formData: FormData) {
  try {
    // Get the authenticated user
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Not authenticated", success: false }
    }

    // Parse and validate contribution amount
    const amountStr = formData.get("amount") as string
    console.log("Amount from form:", amountStr)
    const amount = Number.parseFloat(amountStr)
    
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error("Invalid amount:", amountStr)
      return { error: "Invalid contribution amount", success: false }
    }

    // Get source with default value if empty
    const source = formData.get("source") as string
    const sourceValue = source || "Manual Contribution";
    
    console.log("Processing contribution:", { goalId, amount, source: sourceValue });

    // Initialize Supabase client
    const supabase = await createClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { error: "Database connection error", success: false }
    }
    
    // Get the goal to update
    const { data: goal, error: goalError } = await supabase
      .from("user_goals")
      .select("*")
      .eq("id", goalId)
      .single()

    if (goalError || !goal) {
      console.error("Goal not found:", goalError)
      return { error: "Goal not found", success: false }
    }

    // Add the contribution directly to the goal
    console.log("Adding contribution directly:", { goalId, amount, source: sourceValue });
    
    const result = await addContributionDirectly(
      supabase, 
      goalId, 
      amount, 
      sourceValue, 
      user.id
    );
    
    if (!result.success) {
      console.error("Error adding contribution:", result.error);
      return { 
        error: `Failed to add contribution: ${result.error?.message || 'Unknown error'}`, 
        success: false 
      };
    }
    
    console.log("Contribution added successfully");

    // Force revalidation of the goals pages
    revalidatePath('/goals')
    revalidatePath(`/goals/${goalId}`)
    
    return { success: true, data: { amount, source: sourceValue } }
  } catch (error) {
    console.error("Error in addGoalContribution:", error)
    return { error: "Failed to process contribution", success: false }
  }
}

// Helper function to handle goal contributions directly without needing a separate table
async function addContributionDirectly(supabase: any, goalId: string, amount: number, source: string, userId: string) {
  try {
    console.log("Adding contribution directly to goal...");
    
    // Get the current goal data
    const { data: goal, error: goalError } = await supabase
      .from("user_goals")
      .select("current_savings, target_amount")
      .eq("id", goalId)
      .single();
    
    if (goalError) {
      console.error("Error fetching goal:", goalError);
      return { success: false, error: goalError };
    }
    
    // Calculate new savings amount
    const currentSavings = goal.current_savings || 0;
    const newSavings = currentSavings + amount;
    console.log("Updating goal savings:", { currentSavings, newSavings });
    
    // Update the goal with the new savings amount
    const { error: updateError } = await supabase
      .from("user_goals")
      .update({
        current_savings: newSavings,
        is_achieved: newSavings >= goal.target_amount,
        updated_at: new Date().toISOString()
      })
      .eq("id", goalId);
    
    if (updateError) {
      console.error("Error updating goal savings:", updateError);
      return { success: false, error: updateError };
    }
    
    console.log("Successfully updated goal savings");
    return { success: true, data: { amount, source } };
  } catch (error) {
    console.error("Error in addContributionDirectly:", error);
    return { success: false, error };
  }
}

export async function updateGoal(goalId: string, formData: FormData) {
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

    // Check if goal belongs to user
    const { data: existingGoal, error: fetchError } = await supabase
      .from("user_goals")
      .select("user_id")
      .eq("id", goalId)
      .single()

    if (fetchError || !existingGoal) {
      return { error: "Goal not found", success: false }
    }

    if (existingGoal.user_id !== user.id) {
      return { error: "Not authorized", success: false }
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const targetAmount = Number.parseFloat(formData.get("target_amount") as string)
    const startDate = formData.get("start_date") as string
    const targetDate = formData.get("target_date") as string
    const goalType = formData.get("goal_type") as GoalType
    const imageUrl = formData.get("image_url") as string
    const priority = Number.parseInt(formData.get("priority") as string)
    const fundingStrategy = formData.get("funding_strategy") as FundingStrategy
    const isShared = formData.get("is_shared") === "true"

    const { data: goal, error } = await supabase
      .from("user_goals")
      .update({
        name,
        description,
        target_amount: targetAmount,
        start_date: startDate ? new Date(startDate) : null,
        target_date: targetDate ? new Date(targetDate) : null,
        goal_type: goalType,
        image_url: imageUrl || null,
        priority,
        funding_strategy: fundingStrategy || null,
        is_shared: isShared,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId)
      .select()
      .single()

    if (error) {
      console.error("Error updating goal:", error)
      return { error: error.message, success: false }
    }

    revalidatePath("/goals")
    revalidatePath(`/goals/${goalId}`)
    return { success: true, goal, error: null }
  } catch (error) {
    console.error("Error in updateGoal:", error)
    return { error: "Failed to update goal", success: false }
  }
}
