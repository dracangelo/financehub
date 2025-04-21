-- Income sources table
CREATE TABLE IF NOT EXISTS income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'primary', 'secondary', 'passive', 'investment', etc.
  amount DECIMAL(12,2) NOT NULL,
  frequency TEXT NOT NULL, -- 'one-time', 'daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'annually'
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  is_taxable BOOLEAN DEFAULT TRUE,
  tax_category TEXT, -- 'w2', '1099', 'capital-gains', etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Income events (raises, bonuses, etc.)
CREATE TABLE IF NOT EXISTS income_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_source_id UUID REFERENCES income_sources(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'raise', 'bonus', 'commission', etc.
  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2), -- For percentage-based raises
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- 'annual', 'quarterly', etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deductions table
CREATE TABLE IF NOT EXISTS deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_source_id UUID REFERENCES income_sources(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'pre-tax', 'post-tax'
  category TEXT NOT NULL, -- '401k', 'health-insurance', 'hsa', etc.
  amount DECIMAL(12,2) NOT NULL,
  is_percentage BOOLEAN DEFAULT FALSE,
  frequency TEXT NOT NULL, -- 'per-paycheck', 'monthly', 'annually'
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax brackets (for simulation)
CREATE TABLE IF NOT EXISTS tax_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL, -- 'single', 'married-joint', 'married-separate', 'head-of-household'
  bracket_order INTEGER NOT NULL,
  income_threshold DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tax_year, filing_status, bracket_order)
);

-- Income goals
CREATE TABLE IF NOT EXISTS income_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  start_date DATE NOT NULL,
  target_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  category TEXT, -- 'salary', 'side-hustle', 'passive', etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Side hustle tracking
CREATE TABLE IF NOT EXISTS side_hustle_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_source_id UUID REFERENCES income_sources(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_worked DECIMAL(5,2),
  amount_earned DECIMAL(12,2) NOT NULL,
  expenses DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currency conversion rates (for reference)
CREATE TABLE IF NOT EXISTS currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate DECIMAL(16,6) NOT NULL,
  as_of_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(base_currency, target_currency, as_of_date)
);

