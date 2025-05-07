"use client";

import { useState, useEffect } from "react";
import { WatchlistContent } from "./watchlist-content";
import { getClientWatchlistItems } from "./watchlist-client-actions";

// Define the WatchlistItem type to match what's expected by the component
type WatchlistItem = {
  id: string;
  ticker: string;
  name: string;
  price: number;
  target_price: number | null;
  notes: string;
  sector: string;
  created_at: string;
  updated_at: string;
  price_alerts: boolean;
  alert_threshold: number | null;
};

export function ClientWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add a function to manually trigger authentication recovery
  async function attemptAuthRecovery() {
    try {
      // Import only the getClientUser function
      const { getClientUser } = await import('./watchlist-client-actions');
      
      // Create a Supabase client directly
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase credentials are not properly configured");
        return null;
      }
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Try to refresh the session
      await supabase.auth.refreshSession();
      
      // Check if we have a user now
      const user = await getClientUser();
      
      if (user) {
        console.log("Authentication recovery successful");
        return user;
      } else {
        console.warn("Authentication recovery failed");
        return null;
      }
    } catch (error) {
      console.error("Error in authentication recovery:", error);
      return null;
    }
  }
  
  useEffect(() => {
    async function fetchWatchlistItems() {
      try {
        // First try to recover authentication if needed
        await attemptAuthRecovery();
        
        // Use our client-side action to get watchlist items
        const watchlistItems = await getClientWatchlistItems();
        
        // If we got an empty array, it could be due to no items or authentication issues
        if (!watchlistItems || watchlistItems.length === 0) {
          // Import the getClientUser function to check auth status directly
          const { getClientUser } = await import('./watchlist-client-actions');
          const user = await getClientUser();
          
          if (!user) {
            console.warn("No authenticated user found in client-watchlist");
            setError("Please sign in to view your watchlist");
            setLoading(false);
            return;
          }
          
          // If we have a user but no items, that's fine - just an empty watchlist
          console.log("User is authenticated but has no watchlist items");
        }
        
        // Map the database items to match the expected WatchlistItem interface
        const mappedItems: WatchlistItem[] = (watchlistItems || []).map((item: any) => ({
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
          alert_threshold: item.alert_threshold || null
        }));
        
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
