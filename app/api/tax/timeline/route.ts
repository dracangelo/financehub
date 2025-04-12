import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import * as z from "zod"

const timelineEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "completed", "overdue"]).default("pending"),
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
    const validatedData = timelineEventSchema.parse(body)

    // Insert the timeline event into the database
    const { data, error } = await supabase
      .from("tax_timeline")
      .insert([
        {
          user_id: session.user.id,
          title: validatedData.title,
          date: validatedData.date,
          type: validatedData.type,
          description: validatedData.description,
          status: validatedData.status,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error inserting timeline event:", error)
      return new NextResponse("Error creating timeline event", { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }

    console.error("Error in timeline route:", error)
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

    // Get all timeline events for the user
    const { data, error } = await supabase
      .from("tax_timeline")
      .select("*")
      .eq("user_id", session.user.id)
      .order("date", { ascending: true })

    if (error) {
      console.error("Error fetching timeline events:", error)
      return new NextResponse("Error fetching timeline events", { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in timeline route:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 