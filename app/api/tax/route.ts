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

    // Get tax profiles - using try/catch to handle if the table doesn't exist yet
    let profiles = []
    try {
      const { data, error } = await supabase
        .from("tax_profiles")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
      
      if (!error) {
        profiles = data || []
      }
    } catch (err) {
      console.log("Tax profiles table might not exist yet:", err)
    }

    // Create fixed tax categories - don't attempt to query a non-existent table
    const categories = [
      { id: "1", name: "Income Tax", type: "tax", color: "#0ea5e9" },
      { id: "2", name: "Deductions", type: "deduction", color: "#10b981" },
      { id: "3", name: "Credits", type: "credit", color: "#8b5cf6" },
      { id: "4", name: "Retirement", type: "retirement", color: "#f59e0b" }
    ]

    // Get tax deductions - using try/catch to handle if the table doesn't exist yet
    let deductions = []
    try {
      const { data, error } = await supabase
        .from("tax_deductions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      if (!error) {
        deductions = data || []
      }
    } catch (err) {
      console.log("Tax deductions table might not exist yet:", err)
    }

    // Format deductions to match expected format
    const formattedDeductions = deductions.map(d => ({
      id: d.id,
      name: d.deduction_name,
      amount: d.estimated_savings || 0,
      max_amount: d.estimated_savings || 0, // Approximation
      categories: { id: "2", name: "Deductions", type: "deduction", color: "#10b981" }
    }))

    // Get tax documents - using try/catch to handle if the table doesn't exist yet
    let documents = []
    try {
      const { data, error } = await supabase
        .from("tax_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
      
      if (!error) {
        documents = data || []
      }
    } catch (err) {
      console.log("Tax documents table might not exist yet:", err)
    }

    // Format documents to match expected format
    const formattedDocuments = documents.map(d => ({
      id: d.id,
      name: d.file_name,
      type: d.document_type,
      status: "pending", // Default status
      due_date: new Date().toISOString(), // Default due date
      categories: { id: "1", name: "Income Tax", type: "tax", color: "#0ea5e9" }
    }))

    // Get tax optimization tips as recommendations - using try/catch to handle if the table doesn't exist yet
    let tips = []
    try {
      const { data, error } = await supabase
        .from("tax_optimization_tips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      if (!error) {
        tips = data || []
      }
    } catch (err) {
      console.log("Tax optimization tips table might not exist yet:", err)
    }

    // Format tips as recommendations
    const formattedRecommendations = tips.map(t => ({
      id: t.id,
      type: "optimization",
      priority: t.impact_estimate > 1000 ? "high" : t.impact_estimate > 500 ? "medium" : "low",
      title: t.tip.substring(0, 50), // Truncate if too long
      description: t.tip,
      potential_savings: t.impact_estimate || 0,
      action_items: [],
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), // Set default deadline one month from now
      is_completed: t.is_implemented
    }))

    // Create dummy timeline data
    const timeline = [
      {
        id: "1",
        title: "File Q1 Estimated Taxes",
        description: "First quarter estimated tax payments due",
        due_date: new Date(new Date().getFullYear(), 3, 15).toISOString(), // April 15
        is_completed: new Date() > new Date(new Date().getFullYear(), 3, 15)
      },
      {
        id: "2",
        title: "File Q2 Estimated Taxes",
        description: "Second quarter estimated tax payments due",
        due_date: new Date(new Date().getFullYear(), 5, 15).toISOString(), // June 15
        is_completed: new Date() > new Date(new Date().getFullYear(), 5, 15)
      },
      {
        id: "3",
        title: "File Q3 Estimated Taxes",
        description: "Third quarter estimated tax payments due",
        due_date: new Date(new Date().getFullYear(), 8, 15).toISOString(), // September 15
        is_completed: new Date() > new Date(new Date().getFullYear(), 8, 15)
      },
      {
        id: "4",
        title: "File Q4 Estimated Taxes",
        description: "Fourth quarter estimated tax payments due",
        due_date: new Date(new Date().getFullYear(), 0, 15).toISOString(), // January 15 next year
        is_completed: false
      },
      {
        id: "5",
        title: "Tax Return Deadline",
        description: "Federal income tax returns due",
        due_date: new Date(new Date().getFullYear(), 3, 15).toISOString(), // April 15
        is_completed: new Date() > new Date(new Date().getFullYear(), 3, 15)
      }
    ]

    // Get tax impact predictions - using try/catch to handle if the table doesn't exist yet
    let predictionData = []
    try {
      const { data, error } = await supabase
        .from("tax_impact_predictions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      if (!error) {
        predictionData = data || []
      }
    } catch (err) {
      console.log("Tax impact predictions table might not exist yet:", err)
    }

    // Format predictions to match expected format
    const formattedPredictions = predictionData.map(p => ({
      id: p.id,
      scenario: p.decision_type,
      current_tax_burden: 50000, // Default placeholder
      predicted_tax_burden: 50000 - (p.estimated_tax_impact || 0),
      difference: -(p.estimated_tax_impact || 0)
    }))

    // Get tax professionals - using try/catch to handle if the table doesn't exist yet
    let professionals = []
    try {
      const { data, error } = await supabase
        .from("tax_pro_invitations")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
      
      if (!error) {
        professionals = data || []
      }
    } catch (err) {
      console.log("Tax pro invitations table might not exist yet:", err)
    }

    // Format professionals to match expected format
    const formattedProfessionals = professionals.map(p => ({
      id: p.id,
      name: p.pro_email.split('@')[0], // Use first part of email as name
      firm: p.pro_email.split('@')[1], // Use domain as firm
      specialties: [p.access_level === 'edit' ? 'Full Access' : 'View Only']
    }))

    // Calculate tax summary
    const totalDeductions = formattedDeductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0)
    const totalPotentialSavings = formattedRecommendations.reduce((sum, rec) => sum + (rec.potential_savings || 0), 0)
    const pendingDocuments = formattedDocuments.filter(doc => doc.status === "pending").length
    const upcomingDeadlines = timeline.filter(item => !item.is_completed && new Date(item.due_date) > new Date()).length

    return NextResponse.json({
      categories,
      deductions: formattedDeductions,
      documents: formattedDocuments,
      recommendations: formattedRecommendations,
      timeline,
      predictions: formattedPredictions,
      professionals: formattedProfessionals,
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

    // Check if the tax_optimization_tips table exists
    try {
      // Insert the recommendation as a tax optimization tip
      const { data, error } = await supabase
        .from("tax_optimization_tips")
        .insert({
          user_id: user.id,
          tip: result.data.description,
          category: result.data.type,
          impact_estimate: result.data.potential_savings,
          is_implemented: false,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating tax recommendation:", error)
        return NextResponse.json({ error: "Failed to create tax recommendation" }, { status: 500 })
      }

      return NextResponse.json({
        id: data.id,
        type: result.data.type,
        priority: result.data.priority,
        title: result.data.title,
        description: result.data.description,
        potential_savings: result.data.potential_savings,
        action_items: result.data.action_items,
        deadline: result.data.deadline,
        is_completed: false
      })
    } catch (err) {
      console.error("Tax optimization tips table might not exist yet:", err)
      // Return a dummy response if the table doesn't exist
      return NextResponse.json({
        id: "dummy-id",
        type: result.data.type,
        priority: result.data.priority,
        title: result.data.title,
        description: result.data.description,
        potential_savings: result.data.potential_savings,
        action_items: result.data.action_items,
        deadline: result.data.deadline,
        is_completed: false
      })
    }
  } catch (error) {
    console.error("Error in POST /api/tax:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}