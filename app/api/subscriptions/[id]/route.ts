import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { supabaseAdmin, getCurrentUserId } from "@/lib/supabase";
import { SubscriptionCategory, SubscriptionRecurrence } from "@/types/subscription";

// Schema for subscription validation
const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  service_provider: z.string().nullable(),
  description: z.string().nullable(),
  category: z.string().min(1, "Category is required"),
  amount: z.number().min(0, "Amount must be a positive number"),
  currency: z.string().default("USD"),
  recurrence: z.string().min(1, "Recurrence is required"),
  start_date: z.string().transform(str => new Date(str)),
  end_date: z.string().nullable().transform(str => str ? new Date(str) : null),
  is_active: z.boolean().default(true),
  roi_expected: z.number().nullable(),
  roi_actual: z.number().nullable(),
  roi_notes: z.string().nullable(),
});

// GET /api/subscriptions/[id] - Get a specific subscription
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Ensure subscriptions table exists
    await ensureSubscriptionsTableExists();
    
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
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error("[SUBSCRIPTION_GET]", error);
      
      // If table doesn't exist, return not found
      if (error.code === "42P01") {
        return new NextResponse("Subscription not found", { status: 404 });
      }
      
      return new NextResponse("Database error: " + error.message, { status: 500 });
    }
    
    if (!subscription) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    return NextResponse.json(subscription);
  } catch (error) {
    console.error("[SUBSCRIPTION_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH /api/subscriptions/[id] - Update a subscription
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Ensure subscriptions table exists
    await ensureSubscriptionsTableExists();
    
    const body = await req.json();
    const validatedData = subscriptionSchema.parse(body);
    
    // Check if subscription exists and belongs to user
    const { data: existingSubscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      console.error("[SUBSCRIPTION_PATCH_CHECK]", fetchError);
      
      // If table doesn't exist, return not found
      if (fetchError.code === "42P01") {
        return new NextResponse("Subscription not found", { status: 404 });
      }
      
      // If no rows found, return not found
      if (fetchError.code === "PGRST116") {
        return new NextResponse("Not found", { status: 404 });
      }
      
      return new NextResponse("Database error: " + fetchError.message, { status: 500 });
    }
    
    if (!existingSubscription) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    // Transform the data to match the database column names
    const subscriptionData = {
      name: validatedData.name,
      service_provider: validatedData.service_provider,
      description: validatedData.description,
      category: validatedData.category,
      amount: validatedData.amount,
      currency: validatedData.currency,
      recurrence: validatedData.recurrence,
      start_date: validatedData.start_date,
      end_date: validatedData.end_date,
      is_active: validatedData.is_active,
      roi_expected: validatedData.roi_expected,
      roi_actual: validatedData.roi_actual,
      roi_notes: validatedData.roi_notes,
      updated_at: new Date().toISOString()
    };
    
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .update(subscriptionData)
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error("[SUBSCRIPTION_PATCH]", error);
      return new NextResponse("Database error: " + error.message, { status: 500 });
    }
    
    return NextResponse.json(subscription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    
    console.error("[SUBSCRIPTION_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE /api/subscriptions/[id] - Delete a subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Use the proper async pattern for cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Try to get the user ID from various sources
    let userId = '00000000-0000-0000-0000-000000000000'; // Default fallback
    
    // Try to get from auth
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
    
    // If we couldn't get a user ID from auth, try to get from request headers or cookies
    if (userId === '00000000-0000-0000-0000-000000000000') {
      // Check headers
      const clientId = request.headers.get('client-id');
      if (clientId) {
        userId = clientId;
      } else {
        // Check cookies
        const clientIdCookie = cookieStore.get('client-id');
        if (clientIdCookie) {
          userId = clientIdCookie.value;
        }
      }
    }
    
    console.log(`Deleting subscription ${id} for user ${userId}`);
    
    // Delete the subscription
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting subscription:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to ensure subscriptions table exists
async function ensureSubscriptionsTableExists() {
  try {
    // Check if the table exists
    const { error } = await supabaseAdmin.from('subscriptions').select('id').limit(1);
    
    // If there's an error and it's because the table doesn't exist, create it
    if (error && error.code === '42P01') {
      console.log("Creating subscriptions table...");
      
      // Create the table
      await supabaseAdmin.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          name TEXT NOT NULL,
          service_provider TEXT,
          description TEXT,
          category TEXT NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          currency TEXT DEFAULT 'USD',
          recurrence TEXT NOT NULL,
          start_date DATE,
          end_date DATE,
          is_active BOOLEAN DEFAULT TRUE,
          roi_expected DECIMAL(10, 2),
          roi_actual DECIMAL(10, 2),
          roi_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      // Create RLS policies
      await supabaseAdmin.query(`
        ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own subscriptions"
          ON subscriptions FOR SELECT
          USING (user_id = auth.uid());
          
        CREATE POLICY "Users can insert their own subscriptions"
          ON subscriptions FOR INSERT
          WITH CHECK (user_id = auth.uid());
          
        CREATE POLICY "Users can update their own subscriptions"
          ON subscriptions FOR UPDATE
          USING (user_id = auth.uid());
          
        CREATE POLICY "Users can delete their own subscriptions"
          ON subscriptions FOR DELETE
          USING (user_id = auth.uid());
      `);
    }
  } catch (error) {
    console.error("Error ensuring subscriptions table exists:", error);
  }
}

// Helper function to ensure payments table exists
async function ensurePaymentsTableExists() {
  try {
    // Check if the table exists
    const { error } = await supabaseAdmin.from('payments').select('id').limit(1);
    
    // If there's an error and it's because the table doesn't exist, create it
    if (error && error.code === '42P01') {
      console.log("Creating payments table...");
      
      // Create the table
      await supabaseAdmin.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
          amount DECIMAL(10, 2) NOT NULL,
          date DATE NOT NULL,
          status TEXT DEFAULT 'paid',
          payment_method TEXT,
          transaction_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      // Create RLS policies
      await supabaseAdmin.query(`
        ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view payments for their subscriptions"
          ON payments FOR SELECT
          USING (subscription_id IN (
            SELECT id FROM subscriptions WHERE user_id = auth.uid()
          ));
          
        CREATE POLICY "Users can insert payments for their subscriptions"
          ON payments FOR INSERT
          WITH CHECK (subscription_id IN (
            SELECT id FROM subscriptions WHERE user_id = auth.uid()
          ));
          
        CREATE POLICY "Users can update payments for their subscriptions"
          ON payments FOR UPDATE
          USING (subscription_id IN (
            SELECT id FROM subscriptions WHERE user_id = auth.uid()
          ));
          
        CREATE POLICY "Users can delete payments for their subscriptions"
          ON payments FOR DELETE
          USING (subscription_id IN (
            SELECT id FROM subscriptions WHERE user_id = auth.uid()
          ));
      `);
    }
  } catch (error) {
    console.error("Error ensuring payments table exists:", error);
  }
}
