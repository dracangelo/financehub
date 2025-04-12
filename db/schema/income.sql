-- USERS
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  base_currency text default 'USD',
  created_at timestamp default now()
);

-- INCOME SOURCES
create table income_sources (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  type text check (type in ('salary', 'bonus', 'freelance', 'rental', 'investment', 'passive', 'other')),
  frequency text check (frequency in ('monthly', 'weekly', 'bi-weekly', 'annually', 'one-time')),
  amount numeric not null,
  currency text default 'USD',
  start_date date,
  end_date date,
  is_active boolean default true,
  notes text,
  created_at timestamp default now()
);

-- INCOME TRANSACTIONS (Actual logged incomes)
create table income_transactions (
  id uuid primary key default uuid_generate_v4(),
  income_source_id uuid references income_sources(id) on delete cascade,
  received_at timestamp not null,
  amount numeric not null,
  currency text,
  converted_amount numeric, -- in base currency
  conversion_rate numeric,
  created_at timestamp default now()
);

-- INCOME PROJECTIONS (scheduled raises, future estimates)
create table income_projections (
  id uuid primary key default uuid_generate_v4(),
  income_source_id uuid references income_sources(id) on delete cascade,
  projected_date date,
  projected_amount numeric,
  reason text,
  created_at timestamp default now()
);

-- DEDUCTIONS
create table deductions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text,
  amount numeric,
  type text check (type in ('pre-tax', 'post-tax')),
  frequency text check (frequency in ('monthly', 'weekly', 'annually')),
  applicable_from date,
  applicable_to date,
  notes text,
  created_at timestamp default now()
);

-- TAX BRACKETS
create table tax_brackets (
  id uuid primary key default uuid_generate_v4(),
  country text,
  region text,
  year int,
  income_from numeric,
  income_to numeric,
  tax_rate numeric, -- as percentage
  created_at timestamp default now()
);

-- TAX OPTIMIZATION SUGGESTIONS
create table tax_optimization_suggestions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  suggestion text,
  potential_savings numeric,
  suggestion_date date default current_date
);

-- CURRENCY RATES (for conversion)
create table currency_rates (
  id uuid primary key default uuid_generate_v4(),
  base_currency text,
  target_currency text,
  rate numeric,
  fetched_at timestamp default now()
);

-- DIVERSIFICATION SCORES
create table income_diversification_scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  score numeric check (score >= 0 and score <= 100),
  assessment_date date default current_date,
  insights text,
  created_at timestamp default now()
);

-- PAYCHECK SIMULATIONS
create table paycheck_simulations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  base_salary numeric,
  deductions jsonb,
  taxes jsonb,
  estimated_take_home numeric,
  created_at timestamp default now()
);

-- GOAL CELEBRATION EVENTS
create table income_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  target_amount numeric not null,
  target_date date,
  current_progress numeric default 0,
  is_celebrated boolean default false,
  created_at timestamp default now()
);
