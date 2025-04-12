import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import * as z from "zod"

const documentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  due_date: z.string().min(1, "Due date is required"),
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
    const validatedData = documentSchema.parse(body)

    // Insert the document into the database
    const { data, error } = await supabase
      .from("tax_documents")
      .insert([
        {
          user_id: session.user.id,
          name: validatedData.name,
          type: validatedData.type,
          due_date: validatedData.due_date,
          notes: validatedData.notes,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error inserting document:", error)
      return new NextResponse("Error creating document", { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }

    console.error("Error in documents route:", error)
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

    // Get all documents for the user
    const { data, error } = await supabase
      .from("tax_documents")
      .select("*")
      .eq("user_id", session.user.id)
      .order("due_date", { ascending: true })

    if (error) {
      console.error("Error fetching documents:", error)
      return new NextResponse("Error fetching documents", { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in documents route:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 