import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

// Schema for tax recommendations
const taxRecommendationSchema = z.object({
  type: z.enum(["optimization", "account", "deduction", "timing", "investment", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  title: z.string().min(1),
  description: z.string().min(1),
  potential_savings: z.number().optional(),
  action_items: z.array(z.string()).optional(),
  deadline: z.string().optional(),
})

// GET /api/tax - Get tax summary and recommendations
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Get tax categories
    const { data: categories, error: categoriesError } = await supabase
      .from("tax_categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name")

    if (categoriesError) {
      console.error("Error fetching tax categories:", categoriesError)
      return NextResponse.json({ error: "Failed to fetch tax categories" }, { status: 500 })
    }

    // Get tax deductions
    const { data: deductions, error: deductionsError } = await supabase
      .from("tax_deductions")
      .select(`
        *,
        categories:category_id (id, name, color)
      `)
      .eq("user_id", user.id)
      .order("name")

    if (deductionsError) {
      console.error("Error fetching tax deductions:", deductionsError)
      return NextResponse.json({ error: "Failed to fetch tax deductions" }, { status: 500 })
    }

    // Get tax documents
    const { data: documents, error: documentsError } = await supabase
      .from("tax_documents")
      .select(`
        *,
        categories:category_id (id, name, color)
      `)
      .eq("user_id", user.id)
      .order("due_date", { ascending: true })

    if (documentsError) {
      console.error("Error fetching tax documents:", documentsError)
      return NextResponse.json({ error: "Failed to fetch tax documents" }, { status: 500 })
    }

    // Get tax recommendations
    const { data: recommendations, error: recommendationsError } = await supabase
      .from("tax_recommendations")
      .select("*")
      .eq("user_id", user.id)
      .order("priority", { ascending: false })
      .order("deadline", { ascending: true })

    if (recommendationsError) {
      console.error("Error fetching tax recommendations:", recommendationsError)
      return NextResponse.json({ error: "Failed to fetch tax recommendations" }, { status: 500 })
    }

    // Get tax timeline
    const { data: timeline, error: timelineError } = await supabase
      .from("tax_timeline")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true })

    if (timelineError) {
      console.error("Error fetching tax timeline:", timelineError)
      return NextResponse.json({ error: "Failed to fetch tax timeline" }, { status: 500 })
    }

    // Get tax impact predictions
    const { data: predictions, error: predictionsError } = await supabase
      .from("tax_impact_predictions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (predictionsError) {
      console.error("Error fetching tax impact predictions:", predictionsError)
      return NextResponse.json({ error: "Failed to fetch tax impact predictions" }, { status: 500 })
    }

    // Get tax professionals
    const { data: professionals, error: professionalsError } = await supabase
      .from("tax_professionals")
      .select("*")
      .eq("user_id", user.id)
      .order("name")

    if (professionalsError) {
      console.error("Error fetching tax professionals:", professionalsError)
      return NextResponse.json({ error: "Failed to fetch tax professionals" }, { status: 500 })
    }

    // Calculate tax summary
    const totalDeductions = deductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0)
    const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + (rec.potential_savings || 0), 0)
    const pendingDocuments = documents.filter(doc => doc.status === "pending").length
    const upcomingDeadlines = timeline.filter(item => !item.is_completed && new Date(item.due_date) > new Date()).length

    return NextResponse.json({
      categories,
      deductions,
      documents,
      recommendations,
      timeline,
      predictions,
      professionals,
      summary: {
        totalDeductions,
        totalPotentialSavings,
        pendingDocuments,
        upcomingDeadlines
      }
    })
  } catch (error) {
    console.error("Error in GET /api/tax:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tax - Create a new tax recommendation
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Validate request body
    const result = taxRecommendationSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request data", details: result.error.format() }, { status: 400 })
    }

    // Insert the recommendation
    const { data, error } = await supabase
      .from("tax_recommendations")
      .insert({
        user_id: user.id,
        type: result.data.type,
        priority: result.data.priority,
        title: result.data.title,
        description: result.data.description,
        potential_savings: result.data.potential_savings,
        action_items: result.data.action_items,
        deadline: result.data.deadline,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating tax recommendation:", error)
      return NextResponse.json({ error: "Failed to create tax recommendation" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/tax:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 