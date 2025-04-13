import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

// Schema for tax impact predictions
const taxImpactPredictionSchema = z.object({
  decision_type: z.string().min(1),
  description: z.string().optional(),
  estimated_tax_impact: z.number().optional(),
  notes: z.string().optional(),
})

// GET /api/tax/predictions - Get tax impact predictions
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("tax_impact_predictions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tax impact predictions:", error)
      return NextResponse.json({ error: "Failed to fetch tax impact predictions" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/tax/predictions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tax/predictions - Create a new tax impact prediction
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Validate request body
    const result = taxImpactPredictionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request data", details: result.error.format() }, { status: 400 })
    }

    // Insert the prediction
    const { data, error } = await supabase
      .from("tax_impact_predictions")
      .insert({
        user_id: user.id,
        decision_type: result.data.decision_type,
        description: result.data.description,
        estimated_tax_impact: result.data.estimated_tax_impact,
        notes: result.data.notes,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating tax impact prediction:", error)
      return NextResponse.json({ error: "Failed to create tax impact prediction" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/tax/predictions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/tax/predictions/:id - Update a tax impact prediction
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = new URL(request.url).pathname.split('/').pop()
    if (!id) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Validate request body
    const result = taxImpactPredictionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request data", details: result.error.format() }, { status: 400 })
    }

    // Verify ownership
    const { data: existingPrediction, error: fetchError } = await supabase
      .from("tax_impact_predictions")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingPrediction) {
      return NextResponse.json({ error: "Tax impact prediction not found" }, { status: 404 })
    }

    // Update the tax impact prediction
    const { data, error } = await supabase
      .from("tax_impact_predictions")
      .update({
        decision_type: result.data.decision_type,
        description: result.data.description,
        estimated_tax_impact: result.data.estimated_tax_impact,
        notes: result.data.notes,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating tax impact prediction:", error)
      return NextResponse.json({ error: "Failed to update tax impact prediction" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/tax/predictions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tax/predictions/:id - Delete a tax impact prediction
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = new URL(request.url).pathname.split('/').pop()
    if (!id) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Verify ownership
    const { data: existingPrediction, error: fetchError } = await supabase
      .from("tax_impact_predictions")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingPrediction) {
      return NextResponse.json({ error: "Tax impact prediction not found" }, { status: 404 })
    }

    // Delete the tax impact prediction
    const { error } = await supabase
      .from("tax_impact_predictions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting tax impact prediction:", error)
      return NextResponse.json({ error: "Failed to delete tax impact prediction" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/tax/predictions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}