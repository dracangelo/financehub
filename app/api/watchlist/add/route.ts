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

// POST endpoint to add an item to the watchlist
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { ticker, name, price, targetPrice, notes, sector, priceAlerts, alertThreshold, userId } = body
    
    // Validate required fields
    if (!ticker || !name) {
      return NextResponse.json({ 
        success: false, 
        error: "Ticker and name are required fields" 
      }, { status: 400 })
    }
    
    // Validate user ID
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "User ID is required" 
      }, { status: 400 })
    }
    
    // Create a Supabase client
    const supabase = createAnonymousSupabaseClient()
    
    // Check if the item already exists in the watchlist
    const { data: existingItems, error: checkError } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('ticker', ticker.toUpperCase())
    
    if (checkError) {
      // If the table doesn't exist, attempt to create it
      if (checkError.code === "42P01") { // PostgreSQL code for undefined_table
        console.log("Watchlist table doesn't exist yet. Creating it...")
        
        try {
          // Try to create the watchlist table using RPC
          const { error: rpcError } = await supabase.rpc('create_watchlist_table')
          
          if (rpcError) {
            console.warn("RPC create_watchlist_table failed:", rpcError)
            return NextResponse.json({ 
              success: false, 
              error: "Failed to create watchlist table" 
            }, { status: 500 })
          }
        } catch (error) {
          console.error("Error creating watchlist table:", error)
          return NextResponse.json({ 
            success: false, 
            error: "Failed to create watchlist table" 
          }, { status: 500 })
        }
      } else {
        console.error("Error checking for existing watchlist item:", checkError)
        return NextResponse.json({ 
          success: false, 
          error: "Failed to check for existing watchlist item" 
        }, { status: 500 })
      }
    }
    
    // If the item already exists, return an error
    if (existingItems && existingItems.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `${ticker} is already in your watchlist` 
      }, { status: 400 })
    }
    
    // Prepare the item data
    const itemData = {
      id: crypto.randomUUID(),
      user_id: userId,
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
    
    // Insert the item into the watchlist
    const { data: newItem, error: insertError } = await supabase
      .from('watchlist')
      .insert(itemData)
      .select()
    
    if (insertError) {
      console.error("Error adding item to watchlist:", insertError)
      return NextResponse.json({ 
        success: false, 
        error: "Failed to add item to watchlist" 
      }, { status: 500 })
    }
    
    // Return the new item
    return NextResponse.json({ 
      success: true, 
      message: `${ticker} added to your watchlist`,
      item: newItem?.[0] || itemData
    })
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    return NextResponse.json({ 
      success: false, 
      error: "An unexpected error occurred" 
    }, { status: 500 })
  }
}
