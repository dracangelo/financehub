import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin, getCurrentUserId } from "@/lib/supabase"
import { Subscription, ROICalculation } from "@/types/subscription"

// Calculate ROI for a subscription
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const { subscriptionId } = body
    
    if (!subscriptionId) {
      return new NextResponse("Subscription ID is required", { status: 400 })
    }
    
    // Get the subscription details
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error("[SUBSCRIPTION_ROI]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    if (!subscription) {
      return new NextResponse("Subscription not found", { status: 404 })
    }
    
    // Calculate ROI
    const roiCalculation = calculateROI(subscription)
    
    return NextResponse.json(roiCalculation)
  } catch (error) {
    console.error("[SUBSCRIPTION_ROI]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// GET all ROI calculations for a user's subscriptions
export async function GET() {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Get all active subscriptions for the user
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (error) {
      console.error("[SUBSCRIPTIONS_ROI_GET]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json([])
    }
    
    // Calculate ROI for each subscription
    const roiCalculations = subscriptions.map(subscription => calculateROI(subscription))
    
    return NextResponse.json(roiCalculations)
  } catch (error) {
    console.error("[SUBSCRIPTIONS_ROI_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// Helper function to calculate ROI for a subscription
function calculateROI(subscription: Subscription): ROICalculation {
  // Calculate total cost based on subscription duration
  const startDate = new Date(subscription.start_date)
  const endDate = subscription.end_date ? new Date(subscription.end_date) : null
  
  // Calculate duration in months
  let durationMonths = 0
  const now = new Date()
  
  if (endDate) {
    // If subscription has an end date, calculate months between start and end
    durationMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth())
  } else {
    // If subscription is ongoing, calculate months from start until now
    durationMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                     (now.getMonth() - startDate.getMonth())
  }
  
  // Ensure at least 1 month for calculation purposes
  durationMonths = Math.max(1, durationMonths)
  
  // Calculate monthly cost based on recurrence
  let monthlyMultiplier = 1
  switch (subscription.recurrence) {
    case 'daily':
      monthlyMultiplier = 30
      break
    case 'weekly':
      monthlyMultiplier = 4.33
      break
    case 'bi_weekly':
      monthlyMultiplier = 2.17
      break
    case 'monthly':
      monthlyMultiplier = 1
      break
    case 'quarterly':
      monthlyMultiplier = 1/3
      break
    case 'semi_annual':
      monthlyMultiplier = 1/6
      break
    case 'annual':
    case 'yearly':
      monthlyMultiplier = 1/12
      break
    default:
      monthlyMultiplier = 1
  }
  
  const monthlyCost = subscription.amount * monthlyMultiplier
  const annualCost = monthlyCost * 12
  const totalCost = monthlyCost * durationMonths
  
  // Expected return (if provided)
  const expectedReturn = subscription.roi_expected || 0
  
  // Actual return (if provided)
  const actualReturn = subscription.roi_actual || null
  
  // Calculate ROI percentage
  const roiPercentage = expectedReturn > 0 ? ((expectedReturn - totalCost) / totalCost) * 100 : 0
  
  // Calculate ROI ratio
  const roiRatio = expectedReturn > 0 ? expectedReturn / totalCost : 0
  
  // Calculate break-even months
  let breakEvenMonths = null
  if (expectedReturn > 0 && monthlyCost > 0) {
    breakEvenMonths = expectedReturn / monthlyCost
  }
  
  return {
    subscription_id: subscription.id,
    total_cost: totalCost,
    expected_return: expectedReturn,
    actual_return: actualReturn,
    roi_percentage: roiPercentage,
    roi_ratio: roiRatio,
    monthly_cost: monthlyCost,
    annual_cost: annualCost,
    break_even_months: breakEvenMonths
  }
}
