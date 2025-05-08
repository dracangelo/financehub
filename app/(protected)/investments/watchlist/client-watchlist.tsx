"use client";

import { useState, useEffect } from "react";
import { WatchlistContent } from "./watchlist-content";
import { getClientWatchlistItems } from "./watchlist-client-actions";

// Import the WatchlistItem type from watchlist-content
import { WatchlistItem } from "./watchlist-content";

export function ClientWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to map API response items to WatchlistItem interface
  function mapWatchlistItems(items: any[]): WatchlistItem[] {
    return items.map((item: any) => ({
      id: item.id,
      ticker: item.ticker,
      name: item.name,
      price: item.price || 0,
      target_price: item.target_price || null,
      notes: item.notes || "",
      sector: item.sector || "",
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      // Handle both naming conventions for price alerts
      price_alerts: Boolean(item.price_alert_enabled || item.price_alerts || false),
      alert_threshold: item.alert_threshold || null,
      // Add enhanced fields for real-time data
      previous_close: item.previous_close || null,
      price_change: item.price_change || null,
      price_change_percent: item.price_change_percent || null,
      day_high: item.day_high || null,
      day_low: item.day_low || null,
      last_updated: item.last_updated || new Date().toISOString(),
      alert_triggered: Boolean(item.alert_triggered || false)
    }));
  }
  
  // Handle authentication errors by redirecting to sign-in
  async function handleAuthError() {
    try {
      // Create a Supabase client directly
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase credentials are not properly configured");
        return false;
      }
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.warn("Authentication failed, redirecting to sign-in");
        
        // Redirect to login page
        window.location.href = '/login';
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error handling authentication:", error);
      return false;
    }
  }
  
  useEffect(() => {
    async function fetchWatchlistItems() {
      try {
        // Try to fetch the watchlist items directly
        const response = await fetch('/api/watchlist/items', {
          method: 'GET',
          credentials: 'include', // Important for sending cookies
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          // If the response is not OK, check if it's an authentication error
          if (response.status === 401 || response.status === 403) {
            console.warn("Authentication required to view watchlist");
            
            // Add a small delay before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try again one more time
            const retryResponse = await fetch('/api/watchlist/items', {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              }
            });
            
            if (!retryResponse.ok) {
              // If retry also fails, try to handle authentication error by refreshing session
              const authRecovered = await handleAuthError();
              
              if (!authRecovered) {
                // If authentication recovery failed, show error message
                setError("Please sign in to view your watchlist");
                setLoading(false);
                return;
              }
            } else {
              // Retry succeeded, process the response
              const retryData = await retryResponse.json();
              if (retryData.success) {
                const watchlistItems = retryData.items || [];
                const mappedItems = mapWatchlistItems(watchlistItems);
                setItems(mappedItems);
                setLoading(false);
                return;
              }
            }
            
            // We already tried to recover authentication above
            // No need to retry again, just show error
            setError("Failed to authenticate. Please try refreshing the page or sign in again.");
            setLoading(false);
            return;
          }
          
          // For other errors, show a generic error message
          throw new Error(`Failed to fetch watchlist: ${response.status}`);
        }
        
        // Parse the response
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch watchlist");
        }
        
        const watchlistItems = data.items || [];
        
        // If we got an empty array, it's just an empty watchlist (not an auth issue)
        if (watchlistItems.length === 0) {
          console.log("User is authenticated but has no watchlist items");
        }
        
        // Map the items using our helper function
        const mappedItems = mapWatchlistItems(watchlistItems);
        setItems(mappedItems);
      } catch (error) {
        console.error("Error fetching watchlist items:", error);
        // Provide a user-friendly error message
        setError("Unable to load your watchlist. Please try signing in again.");
      } finally {
        setLoading(false);
      }
    }

    fetchWatchlistItems();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground mt-2">Monitor potential investment opportunities</p>
        </div>
        <div className="p-8 text-center">
          <p>Loading watchlist data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground mt-2">Monitor potential investment opportunities</p>
        </div>
        <div className="p-8 text-center">
          <p className="text-red-500">{error}</p>
          <WatchlistContent initialItems={[]} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
        <p className="text-muted-foreground mt-2">Monitor potential investment opportunities</p>
      </div>
      <WatchlistContent initialItems={items} />
    </div>
  );
}
