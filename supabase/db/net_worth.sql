-- ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.networth_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'real_estate', 'cash', 'investment', etc.
  value NUMERIC(18, 2) NOT NULL DEFAULT 0,
  description TEXT,
  acquired_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networth_assets_user_id ON public.networth_assets(user_id);

-- LIABILITIES TABLE
CREATE TABLE IF NOT EXISTS public.networth_liabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'credit_card', 'mortgage', etc.
  amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(5, 2),
  due_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networth_liabilities_user_id ON public.networth_liabilities(user_id);

-- SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS public.networth_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  total_assets NUMERIC(18, 2) NOT NULL,
  total_liabilities NUMERIC(18, 2) NOT NULL,
  net_worth NUMERIC(18, 2) GENERATED ALWAYS AS (total_assets - total_liabilities) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_networth_snapshots_user_id ON public.networth_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_networth_snapshots_month ON public.networth_snapshots(month);

-- ENABLE RLS
ALTER TABLE public.networth_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networth_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networth_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Assets
CREATE POLICY "Users can access their own networth assets" ON public.networth_assets
  USING (auth.uid() = user_id);

-- Liabilities
CREATE POLICY "Users can access their own networth liabilities" ON public.networth_liabilities
  USING (auth.uid() = user_id);

-- Snapshots
CREATE POLICY "Users can access their own networth snapshots" ON public.networth_snapshots
  USING (auth.uid() = user_id);
