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

// GET /api/bills - Get all bills for the current user
export async function GET() {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const { data: bills, error } = await supabaseAdmin
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })
    
    if (error) {
      console.error("[BILLS_GET]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    return NextResponse.json(bills)
  } catch (error) {
    console.error("[BILLS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// POST /api/bills - Create a new bill
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const validatedData = billSchema.parse(body)
    
    // Transform the data to match the database column names
    const billData = {
      user_id: userId,
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
      .insert(billData)
      .select()
      .single()
    
    if (error) {
      console.error("[BILLS_POST]", error)
      return new NextResponse("Database error", { status: 500 })
    }
    
    return NextResponse.json(bill)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    console.error("[BILLS_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 