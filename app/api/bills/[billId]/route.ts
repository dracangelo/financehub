import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin, getCurrentUserId } from "@/lib/supabase"

// Schema for bill validation
const billSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.number().min(0, "Amount must be a positive number"),
  dueDate: z.string().transform(str => new Date(str)),
  isRecurring: z.boolean().default(false),
  frequency: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  status: z.enum(["pending", "paid", "overdue"]).default("pending"),
  notes: z.string().optional(),
})

// GET /api/bills/[billId] - Get a specific bill
export async function GET(
  req: Request,
  { params }: { params: { billId: string } }
) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const { data: bill, error } = await supabaseAdmin
      .from('bills')
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
      .eq('id', params.billId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error("[BILL_GET]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    if (!bill) {
      return new NextResponse("Not found", { status: 404 })
    }
    
    return NextResponse.json(bill)
  } catch (error) {
    console.error("[BILL_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// PATCH /api/bills/[billId] - Update a bill
export async function PATCH(
  req: Request,
  { params }: { params: { billId: string } }
) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const validatedData = billSchema.parse(body)
    
    // Check if bill exists and belongs to user
    const { data: existingBill, error: fetchError } = await supabaseAdmin
      .from('bills')
      .select('id')
      .eq('id', params.billId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError || !existingBill) {
      return new NextResponse("Not found", { status: 404 })
    }
    
    // Transform the data to match the database column names
    const billData = {
      name: validatedData.name,
      category: validatedData.category,
      amount: validatedData.amount,
      due_date: validatedData.dueDate,
      is_recurring: validatedData.isRecurring,
      frequency: validatedData.frequency,
      payment_method: validatedData.paymentMethod,
      status: validatedData.status,
      notes: validatedData.notes,
    }
    
    const { data: bill, error } = await supabaseAdmin
      .from('bills')
      .update(billData)
      .eq('id', params.billId)
      .select()
      .single()
    
    if (error) {
      console.error("[BILL_PATCH]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    return NextResponse.json(bill)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    console.error("[BILL_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// DELETE /api/bills/[billId] - Delete a bill
export async function DELETE(
  req: Request,
  { params }: { params: { billId: string } }
) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Check if bill exists and belongs to user
    const { data: existingBill, error: fetchError } = await supabaseAdmin
      .from('bills')
      .select('id')
      .eq('id', params.billId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError || !existingBill) {
      return new NextResponse("Not found", { status: 404 })
    }
    
    const { error } = await supabaseAdmin
      .from('bills')
      .delete()
      .eq('id', params.billId)
    
    if (error) {
      console.error("[BILL_DELETE]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[BILL_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 