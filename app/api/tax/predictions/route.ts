import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

// Schema for tax impact predictions
const taxImpactPredictionSchema = z.object({
  // Support both naming conventions
  decision_type: z.string().min(1),
  scenario: z.string().min(1).optional(),
  description: z.string().optional(),
  estimated_tax_impact: z.number().optional(),
  difference: z.number().optional(),
  current_tax_burden: z.number().optional(),
  predicted_tax_burden: z.number().optional(),
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
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize database connection" }, { status: 500 })
    }

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
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize database connection" }, { status: 500 })
    }
    
    const body = await request.json()

    // Validate request body
    const result = taxImpactPredictionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request data", details: result.error.format() }, { status: 400 })
    }

    // Create a mock response for development
    // This is a temporary solution until the database table is properly set up
    const mockResponse = {
      id: crypto.randomUUID(),
      user_id: user.id,
      decision_type: result.data.decision_type || result.data.scenario || "Tax Scenario",
      description: result.data.description || "",
      estimated_tax_impact: result.data.estimated_tax_impact || result.data.difference || 0,
      notes: JSON.stringify({
        current_tax_burden: result.data.current_tax_burden || 0,
        predicted_tax_burden: result.data.predicted_tax_burden || 0,
        user_notes: result.data.notes || ""
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Log the mock response for debugging
    console.log("Created mock tax prediction:", mockResponse)

    // Return the mock response
    return NextResponse.json(mockResponse)
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
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize database connection" }, { status: 500 })
    }
    
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
      return NextResponse.json({ error: "Prediction not found or unauthorized" }, { status: 404 })
    }

    // Prepare update data
    const updateData = {
      decision_type: result.data.decision_type || result.data.scenario,
      description: result.data.description,
      estimated_tax_impact: result.data.estimated_tax_impact || result.data.difference,
      notes: result.data.notes,
      updated_at: new Date()
    }

    // Update the prediction
    const { data, error } = await supabase
      .from("tax_impact_predictions")
      .update(updateData)
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
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize database connection" }, { status: 500 })
    }

    // Verify ownership
    const { data: existingPrediction, error: fetchError } = await supabase
      .from("tax_impact_predictions")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingPrediction) {
      return NextResponse.json({ error: "Prediction not found or unauthorized" }, { status: 404 })
    }

    // Delete the prediction
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
