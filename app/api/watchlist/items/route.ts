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
      price_alert_enabled: Math.random() > 0.5,
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
    console.log('Cookie header:', request.headers.get('cookie'));
    
    // Try to get the user ID with a clear priority order
    // 1. Client ID from cookie (highest priority)
    // 2. Client ID from header
    // 3. Authenticated user ID from cookie
    // 4. Authenticated user ID from Supabase auth
    // 5. Default UUID (lowest priority)
    
    // Start with a valid UUID format for the default user ID to avoid database errors
    let userId: string = '00000000-0000-0000-0000-000000000000';
    
    // Get all possible headers and cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const clientIdHeader = request.headers.get('x-client-id');
    const userIdHeader = request.headers.get('x-user-id');
    
    // Extract client ID from cookie if present
    const clientIdMatch = cookieHeader.match(/client-id=([^;]+)/);
    
    // Priority 1: Client ID from cookie
    if (clientIdMatch && clientIdMatch[1]) {
      userId = clientIdMatch[1];
      console.log('Using client ID from cookie:', userId);
    } 
    // Priority 2: Client ID from header
    else if (clientIdHeader) {
      userId = clientIdHeader;
      console.log('Using client ID from header:', userId);
    }
    // Priority 3: Authenticated user ID from cookie
    else {
      const authUserIdMatch = cookieHeader.match(/x-auth-user-id=([^;]+)/);
      if (authUserIdMatch && authUserIdMatch[1]) {
        userId = authUserIdMatch[1];
        console.log('Using authenticated user ID from cookie:', userId);
      }
      // Priority 4: Try to get the user from Supabase auth
      else {
        try {
          // Try to get the user using getUser
          const { data, error } = await supabase.auth.getUser();
          
          if (!error && data?.user) {
            userId = data.user.id;
            console.log('Using authenticated user ID from Supabase:', userId);
          } else {
            // Try to get the session as a fallback
            try {
              const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
              
              if (!sessionError && sessionData?.session?.user) {
                userId = sessionData.session.user.id;
                console.log('Using session user ID from Supabase:', userId);
              }
            } catch (sessionError) {
              console.error('Error getting session:', sessionError);
            }
          }
        } catch (authError) {
          console.error('Error during authentication check:', authError);
        }
      }
    }
    
    // Log the final user ID being used
    console.log('Fetching watchlist items from database for user:', userId);
    
    // Get items from both the database and localStorage
    let databaseItems = [];
    let storedItems = [];
    let userItems = [];
    
    // First, ensure the database schema is properly set up
    try {
      console.log("Ensuring database schema is properly set up...");
      // Use absolute URL or relative URL depending on environment
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (request.headers.get('origin') || 'http://localhost:3000');
      const setupResponse = await fetch(`${baseUrl}/api/database/setup`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!setupResponse.ok) {
        console.warn("Database setup failed, but will continue with client-side storage:", await setupResponse.text());
      } else {
        console.log("Database setup completed successfully");
      }
    } catch (setupError) {
      console.error("Error setting up database schema:", setupError);
      // Continue anyway, we'll use client-side storage as fallback
    }
    
    // 1. First try to get items from the database
    try {
      console.log('Fetching watchlist items from database for user:', userId);
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching watchlist items from database:', error);
      } else if (data && data.length > 0) {
        console.log('Found', data.length, 'items in database');
        databaseItems = data;
      } else {
        console.log('No items found in database');
      }
    } catch (dbError) {
      console.error('Exception fetching watchlist items from database:', dbError);
    }
    
    // 2. Check if we have any stored items in the request headers
    const storedItemsHeader = request.headers.get('x-stored-items');
    // clientIdHeader is already declared above
    
    if (storedItemsHeader) {
      try {
        // Try to parse the stored items from the header
        storedItems = JSON.parse(storedItemsHeader);
        console.log('Found stored items in header:', storedItems.length);
      } catch (e) {
        console.error('Error parsing stored items from header:', e);
      }
    }
    
    // If we have a client ID but no stored items in the header, try to use mock data
    if (clientIdHeader && storedItems.length === 0 && databaseItems.length === 0) {
      console.log('Using mock data for client ID:', clientIdHeader);
      storedItems = getMockWatchlistItems(clientIdHeader);
    }
    
    // 3. Combine items from both sources, prioritizing database items
    // Create a map of database items by ticker for easy lookup
    const databaseItemMap = new Map<string, any>();
    databaseItems.forEach((item: any) => {
      if (item && item.ticker) {
        databaseItemMap.set(item.ticker, item);
      }
    });
    
    // Add stored items that don't exist in the database
    storedItems.forEach((item: any) => {
      if (item && item.ticker && !databaseItemMap.has(item.ticker)) {
        databaseItems.push(item);
      }
    });
    
    // Use combined items
    userItems = databaseItems;
    
    // Log the items we found for debugging
    console.log('Combined watchlist items:', userItems.length);
    
    // If we have no items from either source, return an empty array
    if (userItems.length === 0) {
      console.log('No watchlist items found from any source');
      return NextResponse.json({ 
        success: true, 
        items: [] 
      })
    }
    
    // Update the items with real-time data for display
    const updatedItems = userItems.map((item: any) => {
      // Use the actual price from the database or form submission
      const currentPrice = item.price;
      // Only calculate these values if we have a valid price
      const previousClose = currentPrice ? currentPrice * 0.99 : 0; // Slight difference for demo
      const priceChange = currentPrice ? currentPrice - previousClose : 0;
      const priceChangePercent = currentPrice && previousClose ? (priceChange / previousClose) * 100 : 0;
      
      // Handle the field name mismatch between price_alerts and price_alert_enabled
      // Ensure we're consistently using price_alert_enabled in the API response
      const hasPriceAlerts = item.price_alert_enabled !== undefined ? 
        item.price_alert_enabled : 
        (item.price_alerts !== undefined ? item.price_alerts : false);
      
      // Create a complete item with all the fields we need for display
      return {
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        user_id: item.user_id || userId,
        ticker: item.ticker,
        name: item.name,
        // Preserve the original price from the database/form
        price: item.price || 0,
        // Add market data as additional fields, not replacing the original price
        previous_close: previousClose || 0,
        price_change: priceChange || 0,
        price_change_percent: priceChangePercent || 0,
        target_price: item.target_price || null,
        notes: item.notes || "",
        sector: item.sector || "Uncategorized",
        // Include both field names to ensure compatibility
        price_alert_enabled: hasPriceAlerts,
        price_alerts: hasPriceAlerts,
        alert_threshold: item.alert_threshold || null,
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
