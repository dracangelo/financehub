-- Create watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  target_price DECIMAL(12, 2),
  notes TEXT,
  sector TEXT,
  price_alert_enabled BOOLEAN DEFAULT FALSE,
  alert_threshold DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS watchlist_user_id_idx ON public.watchlist(user_id);

-- Create index for ticker searches
CREATE INDEX IF NOT EXISTS watchlist_ticker_idx ON public.watchlist(ticker);

-- Add row level security policies
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own watchlist items
CREATE POLICY watchlist_select_policy ON public.watchlist 
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own watchlist items
CREATE POLICY watchlist_insert_policy ON public.watchlist 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own watchlist items
CREATE POLICY watchlist_update_policy ON public.watchlist 
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own watchlist items
CREATE POLICY watchlist_delete_policy ON public.watchlist 
  FOR DELETE USING (auth.uid() = user_id);
