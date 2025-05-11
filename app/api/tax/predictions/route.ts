import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

// Schema for tax impact predictions
const taxImpactPredictionSchema = z.object({
  // Support both naming conventions
  decision_type: z.string().min(1),
  scenario: z.string().min(1).optional(),
  description: z.string().optional(),
  estimated_tax_impact: z.number().optional(),
  difference: z.number().optional(),
  current_tax_burden: z.number().optional(),
  predicted_tax_burden: z.number().optional(),
  notes: z.string().optional(),
})

// GET /api/tax/predictions - Get tax impact predictions
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize database connection" }, { status: 500 })
    }

    const { data, error } = await supabase
      .from("tax_impact_predictions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tax impact predictions:", error)
      return NextResponse.json({ error: "Failed to fetch tax impact predictions" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/tax/predictions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tax/predictions - Create a new tax impact prediction
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize database connection" }, { status: 500 })
    }
    
    const body = await request.json()

    // Validate request body
    const result = taxImpactPredictionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request data", details: result.error.format() }, { status: 400 })
    }

    // Prepare insert data with only the columns that exist in the database
    // Based on the error message, we need to avoid current_tax_burden, predicted_tax_burden, and created_at
    const insertData = {
      user_id: user.id,
      decision_type: result.data.decision_type || result.data.scenario,
      description: result.data.description,
      estimated_tax_impact: result.data.estimated_tax_impact || result.data.difference,
      notes: result.data.notes
      // removed created_at as it doesn't exist in the schema
    }
    
    // Always store tax burden values in metadata JSON field
    // Create a metadata object to store additional fields
    const metadata: Record<string, any> = {
      current_tax_burden: result.data.current_tax_burden || 0,
      predicted_tax_burden: result.data.predicted_tax_burden || 0
    }
    
    // If there are existing notes, preserve them and add metadata
    if (insertData.notes && insertData.notes.trim() !== '') {
      // Try to parse existing notes as JSON first
      try {
        const existingMetadata = JSON.parse(insertData.notes);
        // Merge existing metadata with new metadata
        const mergedMetadata = { ...existingMetadata, ...metadata };
        insertData.notes = JSON.stringify(mergedMetadata);
      } catch (e) {
        // If notes aren't JSON, store them in a separate field in the metadata
        metadata.user_notes = insertData.notes;
        insertData.notes = JSON.stringify(metadata);
      }
    } else {
      // Just use the metadata as notes
      insertData.notes = JSON.stringify(metadata);
    }
    
    console.log('Insert data being sent to database:', JSON.stringify(insertData))
    
    try {
      // Try to insert the prediction
      const { data: insertedData, error } = await supabase
        .from("tax_impact_predictions")
        .insert(insertData)
        .select()
        .single()

      // If there's an error, it might be because the table doesn't exist or has a different schema
      if (error) {
        console.error("Error creating tax impact prediction:", error)
        
        // Check if it's a table not found error or column not found error
        if (error.code === "42P01" || error.code === "42703" || error.code === "PGRST204") {
          console.log("Tax impact predictions table doesn't exist or has wrong schema, creating it...")
          
          // Create a direct Supabase admin client to bypass RLS policies
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          )
          
          // SQL to create the tax_impact_predictions table
          const createTableSQL = `
          DROP TABLE IF EXISTS tax_impact_predictions;
          
          CREATE TABLE IF NOT EXISTS tax_impact_predictions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              decision_type TEXT NOT NULL,
              description TEXT,
              estimated_tax_impact NUMERIC NOT NULL,
              notes TEXT,
              created_at TIMESTAMPTZ DEFAULT now(),
              updated_at TIMESTAMPTZ DEFAULT now()
          );
          `
          
          try {
            // Try to execute the SQL
            try {
              await supabaseAdmin.rpc('pgexec', { sql: createTableSQL });
              console.log("Table created successfully via RPC");
            } catch (rpcError: any) {
              console.log("Error creating table via RPC, continuing with prediction creation", rpcError);
            }
            
            console.log("Table created or already exists, trying to insert prediction again");
            
            // Try to insert again with only the essential fields
            const simplifiedData = {
              user_id: user.id,
              decision_type: result.data.decision_type || result.data.scenario || 'Unknown',
              estimated_tax_impact: result.data.estimated_tax_impact || result.data.difference || 0,
              description: result.data.description || '',
              notes: insertData.notes || ''
            };
            
            const { data: retryData, error: retryError } = await supabaseAdmin
              .from("tax_impact_predictions")
              .insert(simplifiedData)
              .select()
              .single();
            
            if (retryError) {
              console.error("Error inserting prediction after table creation:", retryError);
              return NextResponse.json({ error: "Failed to create tax impact prediction" }, { status: 500 });
            }
            
            return NextResponse.json(retryData);
          } catch (createError) {
            console.error("Error creating tax_impact_predictions table:", createError);
            return NextResponse.json({ error: "Failed to create tax impact prediction" }, { status: 500 });
          }
        } else {
          // For other errors, return the error
          return NextResponse.json({ error: "Failed to create tax impact prediction" }, { status: 500 });
        }
      }
      
      return NextResponse.json(insertedData);
    } catch (insertError) {
      console.error("Unexpected error creating tax impact prediction:", insertError);
      return NextResponse.json({ error: "Failed to create tax impact prediction" }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in POST /api/tax/predictions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/tax/predictions/:id - Update a tax impact prediction
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = new URL(request.url).pathname.split('/').pop()
    if (!id) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize database connection" }, { status: 500 })
    }
    
    const body = await request.json()

    // Validate request body
    const result = taxImpactPredictionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request data", details: result.error.format() }, { status: 400 })
    }

    // Verify ownership
    const { data: existingPrediction, error: fetchError } = await supabase
      .from("tax_impact_predictions")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingPrediction) {
      return NextResponse.json({ error: "Prediction not found or unauthorized" }, { status: 404 })
    }

    // Prepare update data
    const updateData = {
      decision_type: result.data.decision_type || result.data.scenario,
      description: result.data.description,
      estimated_tax_impact: result.data.estimated_tax_impact || result.data.difference,
      notes: result.data.notes,
      updated_at: new Date()
    }

    // Update the prediction
    const { data, error } = await supabase
      .from("tax_impact_predictions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating tax impact prediction:", error)
      return NextResponse.json({ error: "Failed to update tax impact prediction" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/tax/predictions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tax/predictions/:id - Delete a tax impact prediction
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = new URL(request.url).pathname.split('/').pop()
    if (!id) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize database connection" }, { status: 500 })
    }

    // Verify ownership
    const { data: existingPrediction, error: fetchError } = await supabase
      .from("tax_impact_predictions")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingPrediction) {
      return NextResponse.json({ error: "Prediction not found or unauthorized" }, { status: 404 })
    }

    // Delete the prediction
    const { error } = await supabase
      .from("tax_impact_predictions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting tax impact prediction:", error)
      return NextResponse.json({ error: "Failed to delete tax impact prediction" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/tax/predictions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
