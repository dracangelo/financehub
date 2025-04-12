import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

// Schema for tax impact predictions
const taxImpactPredictionSchema = z.object({
  scenario: z.string().min(1),
  description: z.string().optional(),
  current_tax_burden: z.number().optional(),
  predicted_tax_burden: z.number().optional(),
  difference: z.number().optional(),
  assumptions: z.array(z.string()).optional(),
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

    // Calculate difference if not provided
    let difference = result.data.difference
    if (difference === undefined && result.data.current_tax_burden !== undefined && result.data.predicted_tax_burden !== undefined) {
      difference = result.data.predicted_tax_burden - result.data.current_tax_burden
    }

    // Insert the prediction
    const { data, error } = await supabase
      .from("tax_impact_predictions")
      .insert({
        user_id: user.id,
        scenario: result.data.scenario,
        description: result.data.description,
        current_tax_burden: result.data.current_tax_burden,
        predicted_tax_burden: result.data.predicted_tax_burden,
        difference: difference,
        assumptions: result.data.assumptions,
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