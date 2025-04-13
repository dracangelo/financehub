import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Get the latest diversification score
  const { data: score, error } = await supabase
    .from("income_diversification_scores")
    .select("*")
    .eq("user_id", user.id)
    .order("assessment_date", { ascending: false })
    .limit(1)
    .single()
  
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  if (!score) {
    // Calculate new score if none exists
    return calculateDiversificationScore(supabase, user.id)
  }
  
  return NextResponse.json(score)
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  return calculateDiversificationScore(supabase, user.id)
}

async function calculateDiversificationScore(supabase: any, userId: string) {
  // Get all income sources for the user
  const { data: incomeSources, error: sourcesError } = await supabase
    .from("income_sources")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
  
  if (sourcesError) {
    return NextResponse.json({ error: sourcesError.message }, { status: 500 })
  }
  
  if (!incomeSources || incomeSources.length === 0) {
    return NextResponse.json({ 
      score: 0, 
      insights: "No active income sources found. Add income sources to calculate your diversification score." 
    })
  }
  
  // Calculate total income
  const totalIncome = incomeSources.reduce((sum, source) => sum + Number(source.amount), 0)
  
  // Calculate diversification metrics
  const typeDistribution = {}
  incomeSources.forEach(source => {
    typeDistribution[source.type] = (typeDistribution[source.type] || 0) + Number(source.amount)
  })
  
  // Calculate Herfindahl-Hirschman Index (HHI) - a measure of concentration
  let hhi = 0
  Object.values(typeDistribution).forEach((amount: any) => {
    const marketShare = amount / totalIncome
    hhi += marketShare * marketShare
  })
  
  // Convert HHI to a 0-100 score (lower HHI means better diversification)
  // HHI ranges from 1/n (perfect diversification) to 1 (complete concentration)
  const numTypes = Object.keys(typeDistribution).length
  const minHHI = 1 / numTypes
  const normalizedHHI = (hhi - minHHI) / (1 - minHHI)
  const diversificationScore = Math.round((1 - normalizedHHI) * 100)
  
  // Generate insights
  let insights = ""
  if (diversificationScore < 30) {
    insights = "Your income is highly concentrated. Consider adding more diverse income streams to reduce financial risk."
  } else if (diversificationScore < 60) {
    insights = "Your income diversification is moderate. There's room for improvement by expanding into different income types."
  } else {
    insights = "You have a well-diversified income portfolio. This helps protect against financial shocks in any single income source."
  }
  
  // Save the score to the database
  const { data: savedScore, error: saveError } = await supabase
    .from("income_diversification_scores")
    .insert({
      user_id: userId,
      score: diversificationScore,
      insights,
      assessment_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single()
  
  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 })
  }
  
  return NextResponse.json({
    score: diversificationScore,
    insights,
    assessment_date: new Date().toISOString().split('T')[0]
  })
}
