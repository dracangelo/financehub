import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin, getCurrentUserId } from "@/lib/supabase"
import { OverlappingSubscription } from "@/types/subscription"

// Schema for overlap check validation
const overlapCheckSchema = z.object({
  service_provider: z.string().min(1, "Service provider is required"),
  start_date: z.string().transform(str => new Date(str)),
  end_date: z.string().nullable().transform(str => str ? new Date(str) : null),
  current_id: z.string().uuid().nullable()
})

// Check for overlapping subscriptions
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const validatedData = overlapCheckSchema.parse(body)
    
    // Call the database function to check for overlaps
    const { data, error } = await supabaseAdmin.rpc(
      'check_subscription_overlap',
      {
        p_user_id: userId,
        p_service_provider: validatedData.service_provider,
        p_start_date: validatedData.start_date.toISOString(),
        p_end_date: validatedData.end_date ? validatedData.end_date.toISOString() : null,
        p_current_id: validatedData.current_id
      }
    )
    
    if (error) {
      console.error("[SUBSCRIPTION_OVERLAP_CHECK]", error)
      return new NextResponse("Database error: " + error.message, { status: 500 })
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    console.error("[SUBSCRIPTION_OVERLAP_CHECK]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// GET all potential overlapping subscriptions for a user
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
      console.error("[SUBSCRIPTION_OVERLAPS_GET]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json([])
    }
    
    // Group subscriptions by service provider
    const subscriptionsByProvider: Record<string, any[]> = {}
    
    subscriptions.forEach(subscription => {
      if (subscription.service_provider) {
        if (!subscriptionsByProvider[subscription.service_provider]) {
          subscriptionsByProvider[subscription.service_provider] = []
        }
        subscriptionsByProvider[subscription.service_provider].push(subscription)
      }
    })
    
    // Find providers with multiple subscriptions
    const overlappingProviders = Object.entries(subscriptionsByProvider)
      .filter(([_, providerSubscriptions]) => providerSubscriptions.length > 1)
      .map(([provider, providerSubscriptions]) => {
        return {
          service_provider: provider,
          subscriptions: providerSubscriptions.map(sub => ({
            id: sub.id,
            name: sub.name,
            start_date: sub.start_date,
            end_date: sub.end_date
          })),
          count: providerSubscriptions.length
        }
      })
    
    return NextResponse.json(overlappingProviders)
  } catch (error) {
    console.error("[SUBSCRIPTION_OVERLAPS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
