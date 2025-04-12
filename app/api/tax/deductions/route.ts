import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import * as z from "zod"

const deductionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const validatedData = deductionSchema.parse(body)

    // Insert the deduction into the database
    const { data, error } = await supabase
      .from("deductions")
      .insert([
        {
          user_id: session.user.id,
          name: validatedData.name,
          amount: parseFloat(validatedData.amount),
          category: validatedData.category,
          notes: validatedData.notes,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error inserting deduction:", error)
      return new NextResponse("Error creating deduction", { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }

    console.error("Error in deductions route:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get all deductions for the user
    const { data, error } = await supabase
      .from("deductions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching deductions:", error)
      return new NextResponse("Error fetching deductions", { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in deductions route:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 