import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin, getCurrentUserId } from "@/lib/supabase"

// Schema for subscription validation
const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  cost: z.number().min(0, "Cost must be a positive number"),
  billingCycle: z.string().min(1, "Billing cycle is required"),
  nextBillingDate: z.string().transform(str => new Date(str)),
  usage: z.number().min(0).max(100),
  value: z.number().min(0).max(100),
  paymentMethod: z.string().min(1, "Payment method is required"),
  autoRenew: z.boolean().default(true),
  notes: z.string().optional(),
})

// GET /api/subscriptions - Get all subscriptions for the current user
export async function GET() {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('next_billing_date', { ascending: true })
    
    if (error) {
      console.error("[SUBSCRIPTIONS_GET]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error("[SUBSCRIPTIONS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// POST /api/subscriptions - Create a new subscription
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const validatedData = subscriptionSchema.parse(body)
    
    // Transform the data to match the database column names
    const subscriptionData = {
      user_id: userId,
      name: validatedData.name,
      category: validatedData.category,
      cost: validatedData.cost,
      billing_cycle: validatedData.billingCycle,
      next_billing_date: validatedData.nextBillingDate,
      usage: validatedData.usage,
      value: validatedData.value,
      payment_method: validatedData.paymentMethod,
      auto_renew: validatedData.autoRenew,
      notes: validatedData.notes,
    }
    
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()
    
    if (error) {
      console.error("[SUBSCRIPTIONS_POST]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    return NextResponse.json(subscription)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    console.error("[SUBSCRIPTIONS_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 