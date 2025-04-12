-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- DEBTS: Loans, Credit Cards, etc.
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'personal_loan', 'student_loan', 'mortgage', 'auto_loan', 'other')),
  principal NUMERIC NOT NULL CHECK (principal >= 0),
  interest_rate NUMERIC NOT NULL CHECK (interest_rate >= 0),
  minimum_payment NUMERIC DEFAULT 0 CHECK (minimum_payment >= 0),
  due_date DATE,
  start_date DATE,
  term_months INT CHECK (term_months >= 0),
  is_consolidated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- REPAYMENT STRATEGIES
CREATE TABLE repayment_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL CHECK (strategy_name IN ('avalanche', 'snowball', 'hybrid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- STRATEGY DETAILS (Per-Debt Payments)
CREATE TABLE repayment_plan_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES repayment_strategies(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES debts(id),
  payment_amount NUMERIC NOT NULL CHECK (payment_amount >= 0),
  projected_payoff_date DATE,
  total_interest_saved NUMERIC DEFAULT 0,
  interest_paid NUMERIC DEFAULT 0,
  principal_paid NUMERIC DEFAULT 0
);

-- CREDIT SCORE SIMULATIONS
CREATE TABLE credit_score_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  simulation_date DATE DEFAULT CURRENT_DATE,
  current_score INT CHECK (current_score >= 0),
  projected_score INT CHECK (projected_score >= 0),
  actions JSONB, -- Use JSONB for structured details
  notes TEXT
);

-- DTI (Debt-to-Income) TRACKER
CREATE TABLE dti_ratios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_date DATE DEFAULT CURRENT_DATE,
  monthly_debt NUMERIC NOT NULL CHECK (monthly_debt >= 0),
  monthly_income NUMERIC NOT NULL CHECK (monthly_income > 0),
  dti_ratio NUMERIC GENERATED ALWAYS AS (monthly_debt / monthly_income) STORED
);

-- CONSOLIDATION ANALYSIS (Refinancing Comparisons)
CREATE TABLE consolidation_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_date DATE DEFAULT CURRENT_DATE,
  new_interest_rate NUMERIC NOT NULL CHECK (new_interest_rate >= 0),
  total_cost_old NUMERIC NOT NULL CHECK (total_cost_old >= 0),
  total_cost_new NUMERIC NOT NULL CHECK (total_cost_new >= 0),
  savings NUMERIC GENERATED ALWAYS AS (total_cost_old - total_cost_new) STORED,
  notes TEXT
);

-- LOAN COMPARISONS (New Borrowing Scenarios)
CREATE TABLE loan_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loan_option_name TEXT NOT NULL,
  principal NUMERIC NOT NULL CHECK (principal >= 0),
  interest_rate NUMERIC NOT NULL CHECK (interest_rate >= 0),
  term_months INT NOT NULL CHECK (term_months > 0),
  total_payment NUMERIC NOT NULL CHECK (total_payment >= 0),
  monthly_payment NUMERIC NOT NULL CHECK (monthly_payment >= 0),
  notes TEXT
);

-- PAYMENTS (Actual Payments Made)
CREATE TABLE debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  interest_portion NUMERIC DEFAULT 0 CHECK (interest_portion >= 0),
  principal_portion NUMERIC DEFAULT 0 CHECK (principal_portion >= 0)
);

-- MILESTONES (Progress Motivation & Achievements)
CREATE TABLE debt_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  achieved_date DATE DEFAULT CURRENT_DATE,
  notes TEXT
);

-- CREDIT UTILIZATION TRACKER (for revolving debt like cards)
CREATE TABLE credit_utilization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  credit_limit NUMERIC NOT NULL CHECK (credit_limit > 0),
  current_balance NUMERIC NOT NULL CHECK (current_balance >= 0),
  utilization_rate NUMERIC GENERATED ALWAYS AS (current_balance / credit_limit) STORED,
  ideal_balance NUMERIC,
  recorded_date DATE DEFAULT CURRENT_DATE
);

-- INDEXES for performance
CREATE INDEX idx_debt_user ON debts(user_id);
CREATE INDEX idx_strategy_user ON repayment_strategies(user_id);
CREATE INDEX idx_dti_user_date ON dti_ratios(user_id, recorded_date);
CREATE INDEX idx_utilization_user ON credit_utilization(user_id);
