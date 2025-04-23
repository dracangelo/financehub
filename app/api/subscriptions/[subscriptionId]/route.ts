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
    
    // Ensure subscriptions table exists
    await ensureSubscriptionsTableExists()
    
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
      
      // If table doesn't exist, return not found
      if (error.code === "42P01") {
        return new NextResponse("Subscription not found", { status: 404 })
      }
      
      return new NextResponse("Database error: " + error.message, { status: 500 })
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
    
    // Ensure subscriptions table exists
    await ensureSubscriptionsTableExists()
    
    const body = await req.json()
    const validatedData = subscriptionSchema.parse(body)
    
    // Check if subscription exists and belongs to user
    const { data: existingSubscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('id', params.subscriptionId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError) {
      console.error("[SUBSCRIPTION_PATCH_CHECK]", fetchError)
      
      // If table doesn't exist, return not found
      if (fetchError.code === "42P01") {
        return new NextResponse("Subscription not found", { status: 404 })
      }
      
      // If no rows found, return not found
      if (fetchError.code === "PGRST116") {
        return new NextResponse("Not found", { status: 404 })
      }
      
      return new NextResponse("Database error: " + fetchError.message, { status: 500 })
    }
    
    if (!existingSubscription) {
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
      updated_at: new Date().toISOString()
    }
    
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .update(subscriptionData)
      .eq('id', params.subscriptionId)
      .select()
      .single()
    
    if (error) {
      console.error("[SUBSCRIPTION_PATCH]", error)
      return new NextResponse("Database error: " + error.message, { status: 500 })
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
    
    // Ensure subscriptions table exists
    await ensureSubscriptionsTableExists()
    
    // Check if subscription exists and belongs to user
    const { data: existingSubscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('id', params.subscriptionId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError) {
      console.error("[SUBSCRIPTION_DELETE_CHECK]", fetchError)
      
      // If table doesn't exist, return success (nothing to delete)
      if (fetchError.code === "42P01") {
        return new NextResponse(null, { status: 204 })
      }
      
      // If no rows found, return success (nothing to delete)
      if (fetchError.code === "PGRST116") {
        return new NextResponse(null, { status: 204 })
      }
      
      return new NextResponse("Database error: " + fetchError.message, { status: 500 })
    }
    
    if (!existingSubscription) {
      return new NextResponse("Not found", { status: 404 })
    }
    
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('id', params.subscriptionId)
    
    if (error) {
      console.error("[SUBSCRIPTION_DELETE]", error)
      return new NextResponse("Database error: " + error.message, { status: 500 })
    }
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[SUBSCRIPTION_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// Helper function to ensure subscriptions table exists
async function ensureSubscriptionsTableExists() {
  try {
    // Check if subscriptions table exists
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    
    if (error && error.code === "42P01") {
      console.log("subscriptions table doesn't exist, creating it...")
      
      // Create subscriptions table using RPC
      const { error: createError } = await supabaseAdmin.rpc('create_subscriptions_table')
      
      if (createError) {
        console.error("Error creating subscriptions table:", createError)
      } else {
        console.log("Successfully created subscriptions table")
        
        // Create payments table if needed
        await ensurePaymentsTableExists()
      }
    }
  } catch (error) {
    console.error("Error ensuring subscriptions table exists:", error)
    // Continue execution even if table creation fails
  }
}

// Helper function to ensure payments table exists
async function ensurePaymentsTableExists() {
  try {
    // Check if payments table exists
    const { error } = await supabaseAdmin
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    
    if (error && error.code === "42P01") {
      console.log("payments table doesn't exist, creating it...")
      
      // Create payments table using RPC
      const { error: createError } = await supabaseAdmin.rpc('create_payments_table')
      
      if (createError) {
        console.error("Error creating payments table:", createError)
      } else {
        console.log("Successfully created payments table")
      }
    }
  } catch (error) {
    console.error("Error ensuring payments table exists:", error)
    // Continue execution even if table creation fails
  }
}