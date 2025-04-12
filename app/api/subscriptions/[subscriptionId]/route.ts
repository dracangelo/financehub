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

// GET /api/subscriptions/[subscriptionId] - Get a specific subscription
export async function GET(
  req: Request,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        payments (
          id,
          amount,
          date,
          status,
          payment_method,
          transaction_id
        )
      `)
      .eq('id', params.subscriptionId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error("[SUBSCRIPTION_GET]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    if (!subscription) {
      return new NextResponse("Not found", { status: 404 })
    }
    
    return NextResponse.json(subscription)
  } catch (error) {
    console.error("[SUBSCRIPTION_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// PATCH /api/subscriptions/[subscriptionId] - Update a subscription
export async function PATCH(
  req: Request,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const validatedData = subscriptionSchema.parse(body)
    
    // Check if subscription exists and belongs to user
    const { data: existingSubscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('id', params.subscriptionId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError || !existingSubscription) {
      return new NextResponse("Not found", { status: 404 })
    }
    
    // Transform the data to match the database column names
    const subscriptionData = {
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
      .update(subscriptionData)
      .eq('id', params.subscriptionId)
      .select()
      .single()
    
    if (error) {
      console.error("[SUBSCRIPTION_PATCH]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    return NextResponse.json(subscription)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    console.error("[SUBSCRIPTION_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// DELETE /api/subscriptions/[subscriptionId] - Delete a subscription
export async function DELETE(
  req: Request,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Check if subscription exists and belongs to user
    const { data: existingSubscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('id', params.subscriptionId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError || !existingSubscription) {
      return new NextResponse("Not found", { status: 404 })
    }
    
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('id', params.subscriptionId)
    
    if (error) {
      console.error("[SUBSCRIPTION_DELETE]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[SUBSCRIPTION_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 