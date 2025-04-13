import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Get all income goals for the user
  const { data: goals, error } = await supabase
    .from("income_goals")
    .select("*")
    .eq("user_id", user.id)
    .order("target_date", { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(goals || [])
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { targetAmount, targetDate } = body
    
    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      return NextResponse.json({ error: "Valid target amount is required" }, { status: 400 })
    }
    
    // Create a new income goal
    const { data: goal, error } = await supabase
      .from("income_goals")
      .insert({
        user_id: user.id,
        target_amount: targetAmount,
        target_date: targetDate,
        current_progress: 0,
        is_celebrated: false
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(goal)
  } catch (error) {
    console.error("Error creating income goal:", error)
    return NextResponse.json({ error: "Error creating income goal" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { id, currentProgress, isCelebrated } = body
    
    if (!id) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 })
    }
    
    // Check if the goal exists and belongs to the user
    const { data: existingGoal, error: checkError } = await supabase
      .from("income_goals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
    
    if (checkError || !existingGoal) {
      return NextResponse.json({ error: "Goal not found or access denied" }, { status: 404 })
    }
    
    const updates = {}
    
    if (currentProgress !== undefined) {
      updates["current_progress"] = currentProgress
      
      // Auto-celebrate if progress reaches or exceeds target
      if (Number(currentProgress) >= Number(existingGoal.target_amount) && !existingGoal.is_celebrated) {
        updates["is_celebrated"] = true
      }
    }
    
    if (isCelebrated !== undefined) {
      updates["is_celebrated"] = isCelebrated
    }
    
    // Update the goal
    const { data: updatedGoal, error } = await supabase
      .from("income_goals")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error("Error updating income goal:", error)
    return NextResponse.json({ error: "Error updating income goal" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  
  if (!id) {
    return NextResponse.json({ error: "Goal ID is required" }, { status: 400 })
  }
  
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Delete the goal
  const { error } = await supabase
    .from("income_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
