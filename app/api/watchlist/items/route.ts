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
    
    // Try to get the authenticated user ID
    let userId: string = 'default-user';
    
    // First check for user ID in cookies
    const cookieHeader = request.headers.get('cookie');
    const authUserIdMatch = cookieHeader?.match(/x-auth-user-id=([^;]+)/);
    
    if (authUserIdMatch && authUserIdMatch[1]) {
      userId = authUserIdMatch[1];
      console.log('Using authenticated user ID from cookie:', userId);
    } else {
      // Try to get the user from the auth session
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
            // Check for sb-access-token cookie directly
            const sbAccessTokenMatch = cookieHeader?.match(/sb-access-token=([^;]+)/);
            if (sbAccessTokenMatch && sbAccessTokenMatch[1]) {
              try {
                // Decode the JWT to extract the user information
                const tokenParts = sbAccessTokenMatch[1].split('.');
                if (tokenParts.length === 3) {
                  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                  if (payload.sub) {
                    userId = payload.sub;
                    console.log('Using user ID from JWT token:', userId);
                  }
                }
              } catch (jwtError) {
                console.error('Error extracting user from JWT:', jwtError);
              }
            }
            
            // Fall back to the user ID from the header if we still don't have a user ID
            if (!userId) {
              const userIdHeader = request.headers.get('x-user-id');
              
              if (userIdHeader) {
                userId = userIdHeader;
                console.log('Using user ID from header:', userId);
              } else {
                // Generate a persistent user ID if none exists
                const clientIdCookie = cookieHeader?.match(/client-id=([^;]+)/);
                if (clientIdCookie && clientIdCookie[1]) {
                  userId = clientIdCookie[1];
                  console.log('Using client ID from cookie:', userId);
                } else {
                  // No user ID available, use a default but with a warning
                  userId = 'default-user';
                  console.log('No user ID available, using default - consider implementing persistent client ID');
                }
              }
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
          // Check for client-id cookie as last resort
          const clientIdCookie = cookieHeader?.match(/client-id=([^;]+)/);
          if (clientIdCookie && clientIdCookie[1]) {
            userId = clientIdCookie[1];
            console.log('Using client ID from cookie (after auth error):', userId);
          } else {
            // No user ID available, use a default
            userId = 'default-user';
            console.log('No user ID available, using default (after auth error)');
          }
        }
      }
    }
    
    // Get items from both the database and localStorage
    let databaseItems = [];
    let storedItems = [];
    let userItems = [];
    
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
    const clientIdHeader = request.headers.get('x-client-id');
    
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
      // Generate real-time price data for the ticker
      const currentPrice = item.price || 100; // Use existing price or default
      const previousClose = currentPrice * 0.99; // Slight difference for demo
      const priceChange = currentPrice - previousClose;
      const priceChangePercent = (priceChange / previousClose) * 100;
      
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
        // Add real price data
        price: currentPrice,
        previous_close: previousClose,
        price_change: priceChange,
        price_change_percent: priceChangePercent,
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
