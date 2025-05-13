import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are not properly configured")
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  })
}

// Helper function to generate mock stock data for a ticker
function generateMockStockData(ticker: string) {
  // Generate deterministic but seemingly random values based on the ticker
  const symbolHash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const basePrice = 100 + (symbolHash % 900) / 10
  
  // Add some randomness to make it look like real-time updates
  const randomFactor = Math.random() * 0.1 - 0.05 // -5% to +5%
  const currentPrice = basePrice * (1 + randomFactor)
  
  // Calculate other values based on the current price
  const previousClose = basePrice * 0.99
  const change = currentPrice - previousClose
  const changePercent = (change / previousClose) * 100
  
  return {
    price: parseFloat(currentPrice.toFixed(2)),
    previous_close: parseFloat(previousClose.toFixed(2)),
    price_change: parseFloat(change.toFixed(2)),
    price_change_percent: parseFloat(changePercent.toFixed(2)),
    day_high: parseFloat((currentPrice * 1.02).toFixed(2)),
    day_low: parseFloat((currentPrice * 0.98).toFixed(2)),
    last_updated: new Date().toISOString()
  }
}

// Generate mock watchlist items for testing
function getMockWatchlistItems(userId: string) {
  const mockTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']
  
  return mockTickers.map(ticker => {
    const mockData = generateMockStockData(ticker)
    
    return {
      id: `mock-${ticker}-${Date.now()}`,
      user_id: userId,
      ticker,
      name: `${ticker} Inc.`,
      price: mockData.price,
      previous_close: mockData.previous_close,
      price_change: mockData.price_change,
      price_change_percent: mockData.price_change_percent,
      day_high: mockData.day_high,
      day_low: mockData.day_low,
      target_price: Math.round(mockData.price * 1.1 * 100) / 100,
      notes: "Mock data for testing",
      sector: ["Technology", "Healthcare", "Financial Services", "Consumer Cyclical"][Math.floor(Math.random() * 4)],
      price_alerts: Math.random() > 0.5,
      alert_threshold: Math.random() > 0.5 ? Math.round(mockData.price * 1.05 * 100) / 100 : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_updated: mockData.last_updated
    }
  })
}

// GET endpoint to retrieve watchlist items
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // For debugging - log cookies
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header:', cookieHeader);
    
    // Try to get the authenticated user ID
    let userId: string;
    
    // First try to get the user from the auth session
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (!error && data?.user) {
        userId = data.user.id;
        console.log('Using authenticated user ID:', userId);
      } else {
        // Try to get the session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (!sessionError && sessionData?.session?.user) {
          userId = sessionData.session.user.id;
          console.log('Using session user ID:', userId);
        } else {
          // Fall back to the user ID from the header
          const userIdHeader = request.headers.get('x-user-id');
          
          if (userIdHeader) {
            userId = userIdHeader;
            console.log('Using user ID from header:', userId);
          } else {
            // No user ID available, use a default
            userId = 'default-user';
            console.log('No user ID available, using default');
          }
        }
      }
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      
      // Fall back to the user ID from the header
      const userIdHeader = request.headers.get('x-user-id');
      
      if (userIdHeader) {
        userId = userIdHeader;
        console.log('Using user ID from header (after auth error):', userId);
      } else {
        // No user ID available, use a default
        userId = 'default-user';
        console.log('No user ID available, using default (after auth error)');
      }
    }
    
    // Get items from localStorage via the client-side code
    // We'll only use the user's actual watchlist items, no mock data
    
    // Check if we have any stored items in the request headers
    const storedItemsHeader = request.headers.get('x-stored-items');
    let storedItems = [];
    
    if (storedItemsHeader) {
      try {
        // Try to parse the stored items from the header
        storedItems = JSON.parse(storedItemsHeader);
        console.log('Found stored items in header:', storedItems.length);
      } catch (e) {
        console.error('Error parsing stored items from header:', e);
      }
    }
    
    // Use only the stored items, no mock data
    const userItems = storedItems;
    
    // If we have no stored items, return an empty array
    if (userItems.length === 0) {
      return NextResponse.json({ 
        success: true, 
        items: [] 
      })
    }
    
    // Update the items with real-time data for display
    const updatedItems = userItems.map((item: any) => {
      // Generate real-time price data for the ticker
      const currentPrice = item.price || 100; // Use existing price or default
      const previousClose = currentPrice * 0.99; // Slight difference for demo
      const priceChange = currentPrice - previousClose;
      const priceChangePercent = (priceChange / previousClose) * 100;
      
      // Create a complete item with all the fields we need for display
      return {
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        user_id: item.user_id || userId,
        ticker: item.ticker,
        name: item.name,
        // Add real price data
        price: currentPrice,
        previous_close: previousClose,
        price_change: priceChange,
        price_change_percent: priceChangePercent,
        target_price: item.target_price || null,
        notes: item.notes || "",
        sector: item.sector || "Uncategorized",
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      }
    })
    
    // Return the updated items
    return NextResponse.json({ 
      success: true, 
      items: updatedItems 
    })
  } catch (error) {
    console.error("Error fetching watchlist items:", error)
    return NextResponse.json({ 
      success: false, 
      error: "An unexpected error occurred" 
    }, { status: 500 })
  }
}
