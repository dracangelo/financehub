import { NextResponse } from "next/server"
import * as z from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

// Schema for document updates
const documentUpdateSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/tax/documents/:id - Get a specific tax document
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ID from params safely
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Get the document
    const { data, error } = await supabase
      .from("tax_documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching tax document:", error)
      return NextResponse.json({ error: "Failed to fetch tax document" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/tax/documents/:id:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/tax/documents/:id - Update a tax document
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ID from params safely
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    // Parse the request body
    let body
    try {
      // Try to get the content type
      const contentType = request.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        // Parse as JSON
        const text = await request.text()
        console.log('Request body text:', text)
        
        // Only parse if there's content
        if (text && text.trim()) {
          body = JSON.parse(text)
        } else {
          body = {}
        }
      } else {
        // Handle form data or other formats
        body = {}
        const formData = await request.formData()
        for (const [key, value] of formData.entries()) {
          body[key] = value
        }
      }
      
      console.log("Update request body:", body)
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Validate the request body
    const result = documentUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: result.error.format() 
      }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Create an update object based on the request data
    const updateData: any = {}
    
    // Only update fields that are provided in the request
    if (result.data.name) updateData.name = result.data.name
    if (result.data.type) updateData.document_type = result.data.type
    if (result.data.due_date) updateData.due_date = result.data.due_date
    if (result.data.notes !== undefined) updateData.notes = result.data.notes
    if (result.data.status) updateData.status = result.data.status
    
    // If name is provided, update file_name as well
    if (result.data.name) {
      updateData.file_name = result.data.name
    }
    
    console.log('Updating document with data:', updateData)
    
    // Update the tax document with the provided fields
    const { data, error } = await supabase
      .from("tax_documents")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating tax document:", error)
      return NextResponse.json({ error: "Failed to update tax document" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/tax/documents/:id:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tax/documents/:id - Delete a tax document
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ID from params safely
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Verify ownership
    const { data: existingDocument, error: fetchError } = await supabase
      .from("tax_documents")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      console.error("Error verifying document ownership:", fetchError)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete the document
    const { error: deleteError } = await supabase
      .from("tax_documents")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Error deleting tax document:", deleteError)
      return NextResponse.json({ error: "Failed to delete tax document" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/tax/documents/:id:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
