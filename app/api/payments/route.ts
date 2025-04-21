import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { getSupabase, handleDatabaseError } from "@/lib/db"
import { z } from "zod"

// Schema for payment validation
const paymentSchema = z.object({
  amount: z.number().min(0, "Amount must be a positive number"),
  date: z.string().transform(str => new Date(str)),
  status: z.enum(["completed", "pending", "failed"]).default("pending"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
  subscriptionId: z.string().optional(),
  billId: z.string().optional(),
})

// GET /api/payments - Get all payments for the current user
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const subscriptionId = searchParams.get("subscriptionId")
    const billId = searchParams.get("billId")
    
    const where: any = {
      user_id: user.id,
    }
    
    if (subscriptionId) {
      where.subscriptionId = subscriptionId
    }
    
    if (billId) {
      where.billId = billId
    }
    
    const supabase = await getSupabase()
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*, subscriptions(*), bills(*)')
      .match(where)
      .order('date', { ascending: false })
    
    if (error) {
      console.error("[PAYMENTS_GET] Database error:", error)
      return new NextResponse(JSON.stringify(handleDatabaseError(error)), { status: 500 })
    }
    
    return NextResponse.json(payments)
  } catch (error) {
    console.error("[PAYMENTS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// POST /api/payments - Create a new payment
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const validatedData = paymentSchema.parse(body)
    
    const supabase = await getSupabase()
    
    // Check if subscription or bill exists and belongs to user
    if (validatedData.subscriptionId) {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select()
        .eq('id', validatedData.subscriptionId)
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error || !subscription) {
        return new NextResponse("Subscription not found", { status: 404 })
      }
    }
    
    if (validatedData.billId) {
      const { data: bill, error } = await supabase
        .from('bills')
        .select()
        .eq('id', validatedData.billId)
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error || !bill) {
        return new NextResponse("Bill not found", { status: 404 })
      }
    }
    
    // Create the payment
    const { data: payment, error: createError } = await supabase
      .from('payments')
      .insert({
        ...validatedData,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error("[PAYMENTS_POST] Create error:", createError)
      return new NextResponse(JSON.stringify(handleDatabaseError(createError)), { status: 500 })
    }
    
    // Update subscription or bill status if payment is completed
    if (validatedData.status === "completed") {
      if (validatedData.subscriptionId) {
        const nextBillingDate = new Date(
          new Date(validatedData.date).setMonth(
            new Date(validatedData.date).getMonth() + 1
          )
        )
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            next_billing_date: nextBillingDate.toISOString()
          })
          .eq('id', validatedData.subscriptionId)
        
        if (updateError) {
          console.error("[PAYMENTS_POST] Subscription update error:", updateError)
        }
      }
      
      if (validatedData.billId) {
        const { error: updateError } = await supabase
          .from('bills')
          .update({
            status: "paid"
          })
          .eq('id', validatedData.billId)
        
        if (updateError) {
          console.error("[PAYMENTS_POST] Bill update error:", updateError)
        }
      }
    }
    
    return NextResponse.json(payment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    console.error("[PAYMENTS_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 