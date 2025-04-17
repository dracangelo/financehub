-- USERS (linked with Supabase Auth)


-- BENCHMARKS
create table benchmarks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text
);

-- PORTFOLIOS
create table portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  benchmark_id uuid references benchmarks(id),
  created_at timestamp default now()
);

-- ASSETS
create table assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ticker text,
  asset_type text, -- stock, bond, ETF, real_estate, private_equity, etc.
  esg_score numeric, -- ESG rating 0-100
  sector text,
  is_dividend_paying boolean default false
);

-- ESG METRICS
create table esg_metrics (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  metric_type text, -- Environmental, Social, Governance
  score numeric,
  reported_date date
);

-- HOLDINGS
create table holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  asset_id uuid references assets(id),
  quantity numeric not null,
  cost_basis numeric,
  acquisition_date date
);

-- TRANSACTIONS
create table inv_transactions (
  id uuid primary key default gen_random_uuid(),
  holding_id uuid references holdings(id) on delete cascade,
  type text check (type in ('buy', 'sell', 'dividend_reinvest', 'rebalance')),
  quantity numeric,
  price numeric,
  fee numeric,
  tax_impact numeric,
  transaction_date timestamp default now()
);

-- ASSET PRICE HISTORY
create table asset_prices (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  price_date date,
  closing_price numeric,
  dividend_amount numeric default 0,
  total_return numeric
);

-- CORRELATION HEATMAP
create table portfolio_correlations (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  asset_id_1 uuid references assets(id),
  asset_id_2 uuid references assets(id),
  correlation_value numeric
);

-- EFFICIENT FRONTIER
create table efficient_frontier_points (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  expected_return numeric,
  risk numeric,
  allocation jsonb, -- {"AAPL": 0.5, "BND": 0.5}
  created_at timestamp default now()
);

-- PERFORMANCE ATTRIBUTION
create table performance_attribution (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id),
  factor_name text, -- Sector, Style, Currency, etc.
  contribution numeric,
  period text, -- e.g., 'Q1-2025'
  created_at timestamp default now()
);

-- INVESTMENT FEES
create table investment_fees (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),
  fee_type text, -- e.g., management_fee, expense_ratio
  fee_percent numeric,
  suggested_alternative text
);

-- MARKET CONDITIONS
create table market_conditions (
  id uuid primary key default gen_random_uuid(),
  indicator_name text,
  value numeric,
  recorded_at timestamp default now()
);

-- DASHBOARD PREFERENCES
create table dashboard_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  risk_display_mode text, -- 'simple', 'advanced'
  preferred_view text, -- 'simplified', 'detailed'
  show_market_context boolean default true
);

-- INVESTMENT 
create table investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  name text not null,
  ticker text,
  type text,
  value numeric,
  cost_basis numeric,
  quantity numeric, -- number of shares, bonds, etc.
  initial_price numeric, -- initial buying price per unit
  current_price numeric, -- current market price per unit
  allocation numeric,
  currency text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- PORTFOLIO TARGETS
create table portfolio_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  targets jsonb, -- e.g., {"Stocks": 60, "Bonds": 30, "Cash": 5, "Alternative": 5}
  created_at timestamp default now()
);