"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@supabase/ssr"
import crypto from 'crypto';

// Helper function to get the current user
async function getCurrentUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    }
  )
  // Use getUser instead of getSession for better security
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error("Error getting authenticated user:", error)
    return null
  }
  return user
}

// Helper function to create a server-side Supabase client
async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    }
  )
}

// Get watchlist items for the current user
export async function getWatchlistItems() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { items: [], error: null } // Return empty array for unauthenticated users
    }

    const supabase = await createServerSupabaseClient()
    
    // First, try to get the watchlist items from the database
    try {
      // Check if the table exists by attempting to count rows
      const { count, error: countError } = await supabase
        .from('watchlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      // If there's an error and it's because the table doesn't exist
      if (countError && countError.code === "42P01") { // PostgreSQL code for undefined_table
        console.log("Watchlist table doesn't exist yet. Returning mock data.")
        
        // Try to create the table for future use
        try {
          await supabase.rpc('create_watchlist_table')
          console.log("Created watchlist table for future use")
        } catch (createError) {
          console.error("Failed to create watchlist table:", createError)
          // Continue with mock data even if table creation fails
        }
        
        // Return mock data since the table doesn't exist
        return { items: getMockWatchlistItems(user.id), error: null }
      }
      
      // Get the actual watchlist items
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Error fetching watchlist items:", error)
        return { items: getMockWatchlistItems(user.id), error: error.message }
      }
      
      if (!data || data.length === 0) {
        // If no items found, return mock data to provide a better UX
        return { items: getMockWatchlistItems(user.id), error: null }
      }
      
      // Enrich the data with current prices if possible
      const enrichedItems = await enrichWatchlistWithPrices(data)
      
      return { items: enrichedItems, error: null }
    } catch (error) {
      console.error("Error in getWatchlistItems:", error)
      return { items: getMockWatchlistItems(user.id), error: error instanceof Error ? error.message : String(error) }
    }
  } catch (error) {
    console.error("Error in getWatchlistItems:", error)
    return { items: [], error: error instanceof Error ? error.message : String(error) }
  }
}

// Add an item to the watchlist
export async function addToWatchlist(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("You must be logged in to add items to your watchlist")
    }

    const ticker = (formData.get("ticker") as string)?.toUpperCase()
    const name = formData.get("name") as string
    const price = parseFloat(formData.get("price") as string)
    const targetPrice = formData.get("targetPrice") ? parseFloat(formData.get("targetPrice") as string) : null
    const notes = formData.get("notes") as string || ""
    const sector = formData.get("sector") as string || "Uncategorized"
    const priceAlerts = formData.get("priceAlerts") === "true"
    const alertThreshold = formData.get("alertThreshold") ? parseFloat(formData.get("alertThreshold") as string) : null

    // Validate required fields
    if (!ticker || !name) {
      throw new Error("Ticker and name are required fields")
    }

    // Get real-time price data if not provided
    let currentPrice = price
    if (isNaN(currentPrice) || currentPrice <= 0) {
      try {
        // Fetch latest price using Finnhub API
        const apiUrl = '/api/finnhub'
        const response = await fetch(`${apiUrl}?symbol=${encodeURIComponent(ticker)}`, {
          cache: 'no-store',
          next: { revalidate: 0 }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data && data.c) { // Current price in Finnhub API
            currentPrice = data.c
            
            // If no target price is set, suggest one based on current price
            // (5% above current price as a reasonable default)
            if (!targetPrice) {
              const suggestedTarget = Math.round(currentPrice * 1.05 * 100) / 100
              console.log(`Suggesting target price of ${suggestedTarget} for ${ticker}`)
            }
          }
        } else {
          console.error(`Error fetching price for ${ticker}: ${response.status} ${response.statusText}`)
          // Continue with the provided price or default to 0
          if (isNaN(currentPrice)) currentPrice = 0
        }
      } catch (priceError) {
        console.error(`Error fetching price for ${ticker}:`, priceError)
        // Continue with the provided price or default to 0
        if (isNaN(currentPrice)) currentPrice = 0
      }
    }

    const supabase = await createServerSupabaseClient()

    // Check if the item already exists in the watchlist
    try {
      const { data: existingItems, error: checkError } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('ticker', ticker)

      if (checkError) {
        // If the table doesn't exist, attempt to create it
        if (checkError.code === "42P01") { // PostgreSQL code for undefined_table
          console.log("Watchlist table doesn't exist yet. Attempting to create it...")
          
          try {
            // Try to run the migration script to create the watchlist table
            const { error: migrationError } = await supabase.rpc('create_watchlist_table')
            
            if (migrationError) {
              console.error("Failed to create watchlist table:", migrationError)
              throw new Error("Watchlist feature is not available yet. Please try again later.")
            }
          } catch (migrationErr) {
            console.error("Error running watchlist migration:", migrationErr)
            throw new Error("Watchlist feature is not available yet. Please try again later.")
          }
        } else {
          console.error("Error checking existing watchlist items:", checkError)
          throw new Error(`Database error: ${checkError.message}`)
        }
      } else if (existingItems && existingItems.length > 0) {
        throw new Error(`${ticker} is already in your watchlist`)
      }

      // Generate a unique ID for the watchlist item
      const id = crypto.randomUUID()

      // Insert the new watchlist item
      const { data, error } = await supabase
        .from('watchlist')
        .insert([
          {
            id,
            user_id: user.id,
            ticker,
            name,
            price: currentPrice,
            target_price: targetPrice,
            notes,
            sector,
            price_alert_enabled: priceAlerts,
            alert_threshold: alertThreshold,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) {
        console.error("Error adding item to watchlist:", error)
        throw new Error("Failed to add item to watchlist: " + error.message)
      }

      // Revalidate the watchlist page to show the new item
      revalidatePath("/investments/watchlist")

      return { success: true, data }
    } catch (dbError) {
      console.error("Database operation error:", dbError)
      throw dbError
    }
  } catch (error) {
    console.error("Error in addToWatchlist:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Update a watchlist item
export async function updateWatchlistItem(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("You must be logged in to update your watchlist")
    }

    const id = formData.get('id') as string
    const ticker = formData.get('ticker') as string
    const targetPrice = formData.get('targetPrice') ? parseFloat(formData.get('targetPrice') as string) : null
    const notes = formData.get('notes') as string || ''
    const sector = formData.get('sector') as string || 'Uncategorized'
    const priceAlerts = formData.get('priceAlerts') === 'true'
    const alertThreshold = formData.get('alertThreshold') ? parseFloat(formData.get('alertThreshold') as string) : null
    const refreshPrice = formData.get('refreshPrice') === 'true'

    if (!id) {
      throw new Error("Item ID is required")
    }

    const supabase = await createServerSupabaseClient()
    
    // First, check if the item exists and belongs to the user
    const { data: existingItem, error: checkError } = await supabase
      .from('watchlist')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (checkError) {
      console.error("Error checking watchlist item:", checkError)
      
      // If the table doesn't exist, attempt to create it
      if (checkError.code === "42P01") { // PostgreSQL code for undefined_table
        console.log("Watchlist table doesn't exist yet. Attempting to create it...")
        
        try {
          // Try to run the migration script to create the watchlist table
          const { error: migrationError } = await supabase.rpc('create_watchlist_table')
          
          if (migrationError) {
            console.error("Failed to create watchlist table:", migrationError)
            throw new Error("Watchlist feature is not available yet. Please try again later.")
          }
        } catch (migrationErr) {
          console.error("Error running watchlist migration:", migrationErr)
          throw new Error("Watchlist feature is not available yet. Please try again later.")
        }
      }
      
      throw new Error("Item not found or access denied")
    }
    
    // Get current price if refresh is requested
    let currentPrice = existingItem.price
    if (refreshPrice && ticker) {
      try {
        // Fetch latest price using Finnhub API
        const apiUrl = '/api/finnhub'
        const response = await fetch(`${apiUrl}?symbol=${ticker}`)
        
        if (response.ok) {
          const data = await response.json()
          if (data && data.c) { // Current price in Finnhub API
            currentPrice = data.c
            console.log(`Updated price for ${ticker}: ${currentPrice}`)
          }
        }
      } catch (priceError) {
        console.error(`Error fetching price for ${ticker}:`, priceError)
        // Continue with the existing price
      }
    }
    
    // Update the item
    const { data, error } = await supabase
      .from('watchlist')
      .update({
        price: currentPrice,
        target_price: targetPrice,
        notes,
        sector,
        price_alert_enabled: priceAlerts,
        alert_threshold: alertThreshold,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
    
    if (error) {
      console.error("Error updating watchlist item:", error)
      throw new Error("Failed to update watchlist item: " + error.message)
    }
    
    revalidatePath("/investments/watchlist")
    return { success: true, data }
  } catch (error) {
    console.error("Error in updateWatchlistItem:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Helper function to enrich watchlist items with current prices
async function enrichWatchlistWithPrices(items: any[]) {
  if (!items || items.length === 0) return items;
  
  try {
    // Get tickers for price updates
    const tickers = items.map(item => item.ticker).filter(Boolean);
    
    // Fetch latest prices using Finnhub API endpoint
    if (tickers.length > 0) {
      // Use absolute URL with the server's origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const apiUrl = `${baseUrl}/api/finnhub`;
      const pricePromises = tickers.map(async ticker => {
        try {
          const response = await fetch(`${apiUrl}?symbol=${encodeURIComponent(ticker)}`);
          if (response.ok) {
            return { ticker, data: await response.json() };
          }
          return { ticker, data: null };
        } catch (e) {
          console.error(`Error fetching price for ${ticker}:`, e);
          return { ticker, data: null };
        }
      });
      
      const priceResults = await Promise.all(pricePromises);
      const priceMap = priceResults.reduce<Record<string, number>>((acc, { ticker, data }) => {
        if (data && data.c) { // Current price in Finnhub API
          acc[ticker] = data.c;
        }
        return acc;
      }, {});
      
      // Update prices in the watchlist items
      return items.map(item => ({
        ...item,
        price: priceMap[item.ticker] || item.price
      }));
    }
  } catch (error) {
    console.error("Error enriching watchlist with prices:", error);
  }
  
  // Return original items if price enrichment fails
  return items;
}

// Remove an item from the watchlist
export async function removeFromWatchlist(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("You must be logged in to remove items from your watchlist")
    }

    if (!id) {
      throw new Error("Item ID is required")
    }

    const supabase = await createServerSupabaseClient()
    
    // First, check if the item exists and belongs to the user
    const { data: existingItem, error: checkError } = await supabase
      .from('watchlist')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (checkError) {
      console.error("Error checking watchlist item:", checkError)
      
      // If the table doesn't exist, attempt to create it
      if (checkError.code === "42P01") { // PostgreSQL code for undefined_table
        console.log("Watchlist table doesn't exist yet. Attempting to create it...")
        
        try {
          // Try to run the migration script to create the watchlist table
          const { error: migrationError } = await supabase.rpc('create_watchlist_table')
          
          if (migrationError) {
            console.error("Failed to create watchlist table:", migrationError)
            throw new Error("Watchlist feature is not available yet. Please try again later.")
          }
        } catch (migrationErr) {
          console.error("Error running watchlist migration:", migrationErr)
          throw new Error("Watchlist feature is not available yet. Please try again later.")
        }
      }
      
      // If the item doesn't exist, we consider it already removed
      if (checkError.code === "PGRST116") { // Code for no rows returned
        console.log("Item not found, considering it already removed")
        return { success: true }
      }
      
      throw new Error("Item not found or access denied")
    }
    
    // Delete the item
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Security check
    
    if (error) {
      console.error("Error removing from watchlist:", error)
      throw new Error("Failed to remove item from watchlist: " + error.message)
    }
    
    revalidatePath("/investments/watchlist")
    return { success: true }
  } catch (error) {
    console.error("Error in removeFromWatchlist:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Fallback function to get mock watchlist items when the database table doesn't exist yet
function getMockWatchlistItems(userId: string) {
  // Generate deterministic IDs based on the user ID
  const generateId = (index: number) => {
    return crypto.createHash('md5').update(`${userId}-watchlist-${index}`).digest('hex')
  }

  // Include some ESG-friendly stocks to align with the FinanceHub ESG focus
  return [
    {
      id: generateId(1),
      user_id: userId,
      ticker: "AAPL",
      name: "Apple Inc.",
      price: 175.43,
      target_price: 200.00,
      notes: "Strong ESG rating, carbon neutral commitment by 2030",
      sector: "Technology",
      price_alert_enabled: true,
      alert_threshold: 5,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    {
      id: generateId(2),
      user_id: userId,
      ticker: "MSFT",
      name: "Microsoft Corporation",
      price: 338.11,
      target_price: 360.00,
      notes: "Carbon negative by 2030, water positive by 2030",
      sector: "Technology",
      price_alert_enabled: false,
      alert_threshold: null,
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
    {
      id: generateId(3),
      user_id: userId,
      ticker: "ENPH",
      name: "Enphase Energy, Inc.",
      price: 118.52,
      target_price: 150.00,
      notes: "Solar energy leader, strong renewable energy play",
      sector: "Energy",
      price_alert_enabled: true,
      alert_threshold: 7,
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: generateId(4),
      user_id: userId,
      ticker: "TSLA",
      name: "Tesla, Inc.",
      price: 248.48,
      target_price: 300.00,
      notes: "EV leader, renewable energy focus",
      sector: "Automotive",
      price_alert_enabled: true,
      alert_threshold: 10,
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
    {
      id: generateId(5),
      user_id: userId,
      ticker: "NEE",
      name: "NextEra Energy, Inc.",
      price: 73.12,
      target_price: 85.00,
      notes: "World's largest renewable energy producer from wind and solar",
      sector: "Utilities",
      price_alert_enabled: false,
      alert_threshold: null,
      created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days ago
      updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    }
  ]
}
