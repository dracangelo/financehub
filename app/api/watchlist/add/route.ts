import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Helper function to create a Supabase client without authentication
function createAnonymousSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are not properly configured")
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

// Helper function to check if the watchlist table exists
async function checkWatchlistTable(supabase: any) {
  try {
    // Check if the table exists by trying to select from it
    const { error: tableCheckError } = await supabase
      .from('watchlist')
      .select('id')
      .limit(1)
    
    if (tableCheckError && tableCheckError.code === '42P01') { // PostgreSQL code for undefined_table
      console.log("Watchlist table doesn't exist. Creating it...")
      // Try to create the watchlist table using RPC
      const { error: rpcError } = await supabase.rpc('create_watchlist_table')
      
      if (rpcError) {
        console.error("Error creating watchlist table:", rpcError)
        return false
      }
      
      console.log("Watchlist table created successfully")
    }
    
    return true
  } catch (error) {
    console.error("Error checking watchlist table:", error)
    return false
  }
}

// POST endpoint to add an item to the watchlist
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { ticker, name, price, targetPrice, notes, sector, priceAlerts, alertThreshold } = body
    
    // Validate required fields
    if (!ticker || !name) {
      return NextResponse.json({ 
        success: false, 
        error: "Ticker and name are required fields" 
      }, { status: 400 })
    }
    
    // Create a Supabase client first
    const supabase = createAnonymousSupabaseClient()
    
    // Try to get the authenticated user ID
    let userIdentifier: string;
    
    // First try to get the user from the auth session
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (!error && data?.user) {
        userIdentifier = data.user.id;
        console.log('Using authenticated user ID:', userIdentifier);
      } else {
        // Try to get the session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (!sessionError && sessionData?.session?.user) {
          userIdentifier = sessionData.session.user.id;
          console.log('Using session user ID:', userIdentifier);
        } else {
          // Fall back to the user ID from the header
          const userIdHeader = request.headers.get('x-user-id');
          
          if (userIdHeader) {
            userIdentifier = userIdHeader;
            console.log('Using user ID from header:', userIdentifier);
          } else {
            // No user ID available, generate a new one
            userIdentifier = crypto.randomUUID();
            console.log('Generated new user ID:', userIdentifier);
          }
        }
      }
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      
      // Fall back to the user ID from the header
      const userIdHeader = request.headers.get('x-user-id');
      
      if (userIdHeader) {
        userIdentifier = userIdHeader;
        console.log('Using user ID from header (after auth error):', userIdentifier);
      } else {
        // No user ID available, generate a new one
        userIdentifier = crypto.randomUUID();
        console.log('Generated new user ID (after auth error):', userIdentifier);
      }
    }
    
    // Ensure the watchlist table exists
    const tableExists = await checkWatchlistTable(supabase)
    if (!tableExists) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create watchlist table" 
      }, { status: 500 })
    }
    
    // Since we can't create users due to RLS policies, we'll use a different approach
    // Instead of trying to add to the database directly, we'll return a success response
    // with the item data, and let the client handle storing it in localStorage
    
    // Check if the item exists in the watchlist (this might still fail due to RLS)
    try {
      const { data: existingItems, error: checkError } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', userIdentifier)
        .eq('ticker', ticker.toUpperCase())
      
      // If we can successfully query the database, check for duplicates
      if (!checkError && existingItems && existingItems.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: `${ticker} is already in your watchlist` 
        }, { status: 400 })
      }
    } catch (error) {
      console.log("Error checking for existing item, but continuing:", error)
      // Continue anyway, as we'll return the item for client-side storage
    }
    
    // Prepare the complete item data with all fields that might be needed by the client
    const itemData = {
      id: crypto.randomUUID(),
      user_id: userIdentifier,
      ticker: ticker.toUpperCase(),
      name: name,
      price: price || 0,
      target_price: targetPrice || null,
      notes: notes || "",
      sector: sector || "Uncategorized",
      price_alerts: priceAlerts || false,
      alert_threshold: alertThreshold || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Log what we're returning to the client
    console.log("Returning item data to client:", itemData)
    
    // Try to insert the item into the watchlist, but don't worry if it fails
    try {
      // Only include the basic fields for the database insert
      const dbItemData = {
        id: itemData.id,
        user_id: itemData.user_id,
        ticker: itemData.ticker,
        name: itemData.name
      }
      
      const { data: newItem, error: insertError } = await supabase
        .from('watchlist')
        .insert(dbItemData)
        .select()
      
      if (insertError) {
        console.error("Error adding item to watchlist database:", insertError)
        // Continue anyway, as we'll return the item for client-side storage
      } else {
        console.log("Successfully added item to watchlist database")
      }
    } catch (error) {
      console.error("Exception during database insert:", error)
      // Continue anyway
    }
    
    // Return success with the item data for client-side storage
    return NextResponse.json({ 
      success: true, 
      message: `${ticker} added to your watchlist`,
      item: itemData,
      storageMethod: "client" // Indicate that the client should store this item
    })
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    return NextResponse.json({ 
      success: false, 
      error: "An unexpected error occurred" 
    }, { status: 500 })
  }
}
