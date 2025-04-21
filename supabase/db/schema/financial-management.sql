-- Income Sources Table
CREATE TABLE IF NOT EXISTS income_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- primary, secondary, passive, investment, side-hustle, other
  amount DECIMAL(12, 2) NOT NULL,
  frequency VARCHAR(50) NOT NULL, -- one-time, daily, weekly, bi-weekly, monthly, quarterly, annually
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  is_taxable BOOLEAN NOT NULL DEFAULT TRUE,
  tax_category VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON income_sources(user_id);

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  category_id UUID REFERENCES categories(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_pattern VARCHAR(50) DEFAULT 'monthly', -- weekly, biweekly, monthly, quarterly, semiannually, annually
  auto_pay BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, overdue
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- Bill History Table
CREATE TABLE IF NOT EXISTS bill_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL, -- pending, paid, overdue
  payment_date DATE,
  payment_amount DECIMAL(12, 2),
  payment_method_id UUID REFERENCES payment_methods(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_history_bill_id ON bill_history(bill_id);

-- Bill Negotiations Table
CREATE TABLE IF NOT EXISTS bill_negotiations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'suggested', -- suggested, in_progress, successful, failed
  original_amount DECIMAL(12, 2) NOT NULL,
  negotiated_amount DECIMAL(12, 2),
  savings_amount DECIMAL(12, 2),
  negotiation_date DATE,
  strategy_used TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_negotiations_bill_id ON bill_negotiations(bill_id);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  billing_cycle VARCHAR(50) NOT NULL DEFAULT 'monthly', -- weekly, biweekly, monthly, quarterly, semiannually, annually
  start_date DATE NOT NULL,
  next_billing_date DATE NOT NULL,
  category_id UUID REFERENCES categories(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, paused, cancelled
  cancellation_url TEXT,
  usage_frequency VARCHAR(50) DEFAULT 'medium', -- low, medium, high
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Subscription History Table
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  billing_cycle VARCHAR(50) NOT NULL,
  change_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON subscription_history(subscription_id);

-- Subscription Usage Table
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  usage_value INTEGER DEFAULT 5, -- 1-10 scale of usage value
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);

-- Debts Table
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- credit-card, mortgage, auto, student, personal, medical, other
  balance DECIMAL(12, 2) NOT NULL,
  original_balance DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(6, 3) NOT NULL,
  minimum_payment DECIMAL(12, 2) NOT NULL,
  actual_payment DECIMAL(12, 2) NOT NULL,
  due_date INTEGER NOT NULL, -- Day of month (1-31)
  start_date DATE NOT NULL,
  estimated_payoff_date DATE,
  lender VARCHAR(255),
  account_number VARCHAR(255),
  payment_method_id UUID REFERENCES payment_methods(id),
  autopay BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type);

-- Debt Payments Table
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  principal_amount DECIMAL(12, 2) NOT NULL,
  interest_amount DECIMAL(12, 2) NOT NULL,
  payment_method_id UUID REFERENCES payment_methods(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_payment_date ON debt_payments(payment_date);

-- Payment Methods Table (if not already exists)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- bank_account, credit_card, debit_card, paypal, cash, other
  account_last_four VARCHAR(4),
  expiration_date DATE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- Currency Rates Table (if not already exists)
CREATE TABLE IF NOT EXISTS currency_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency VARCHAR(10) NOT NULL,
  target_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(12, 6) NOT NULL,
  as_of_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(base_currency, target_currency, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_currency_rates_base_currency ON currency_rates(base_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_as_of_date ON currency_rates(as_of_date);

