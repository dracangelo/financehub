import { NextResponse } from "next/server"
import * as z from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

// Schema to match the form fields exactly
const timelineEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  due_date: z.string().min(1, "Due date is required"),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().optional(),
  is_completed: z.boolean().default(false),
})

// Handler for GET requests to fetch a specific timeline item
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    
    if (!id) {
      return NextResponse.json({ error: "Timeline item ID is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Get the specific timeline event for the user
    const { data, error } = await supabase
      .from("tax_timeline")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching timeline event:", error)
      return NextResponse.json({ error: "Failed to fetch timeline event" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/tax/timeline/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Handler for PUT requests to update a specific timeline item
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    
    if (!id) {
      return NextResponse.json({ error: "Timeline item ID is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Create an updated schema that includes is_completed
    const updateTimelineSchema = timelineEventSchema.extend({
      is_completed: z.boolean().default(false)
    })

    // Validate request body
    const result = updateTimelineSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request data", details: result.error.format() }, { status: 400 })
    }

    // Determine the event type based on recurring pattern
    const eventType = result.data.is_recurring ? (result.data.recurrence_pattern || 'recurring') : 'one-time'

    // Update the timeline event
    const { data, error } = await supabase
      .from("tax_timeline")
      .update({
        title: result.data.title,
        description: result.data.description,
        due_date: result.data.due_date,
        type: eventType,
        status: result.data.is_completed ? 'completed' : 'pending',
        is_recurring: result.data.is_recurring,
        recurrence_pattern: result.data.recurrence_pattern,
        is_completed: result.data.is_completed
      })
      .eq("id", id)
      .eq("user_id", user.id) // Ensure user can only update their own items
      .select()
      .single()

    if (error) {
      console.error("Error updating timeline event:", error)
      return NextResponse.json({ error: "Failed to update timeline event" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/tax/timeline/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Handler for DELETE requests to remove a specific timeline item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    
    if (!id) {
      return NextResponse.json({ error: "Timeline item ID is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Delete the timeline event
    const { error } = await supabase
      .from("tax_timeline")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id) // Ensure user can only delete their own items

    if (error) {
      console.error("Error deleting timeline event:", error)
      return NextResponse.json({ error: "Failed to delete timeline event" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/tax/timeline/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
