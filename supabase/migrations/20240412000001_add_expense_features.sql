-- Add missing expense-related tables for comprehensive expense tracking

-- EXPENSE SPLITS
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade,
  shared_with_name text not null,
  amount numeric not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Create policies for expense_splits
CREATE POLICY "Users can view their own expense splits"
    ON expense_splits FOR SELECT
    USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_splits.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can insert their own expense splits"
    ON expense_splits FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_splits.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can update their own expense splits"
    ON expense_splits FOR UPDATE
    USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_splits.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can delete their own expense splits"
    ON expense_splits FOR DELETE
    USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_splits.expense_id AND expenses.user_id = auth.uid()));

-- Create indexes for expense_splits
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);

-- RECEIPTS (linked to expenses)
CREATE TABLE IF NOT EXISTS receipts (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade,
  image_url text,
  text_content text, -- for searchable OCR
  warranty_expiry date,
  receipt_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for receipts
CREATE POLICY "Users can view their own receipts"
    ON receipts FOR SELECT
    USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = receipts.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can insert their own receipts"
    ON receipts FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = receipts.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can update their own receipts"
    ON receipts FOR UPDATE
    USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = receipts.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can delete their own receipts"
    ON receipts FOR DELETE
    USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = receipts.expense_id AND expenses.user_id = auth.uid()));

-- Create indexes for receipts
CREATE INDEX idx_receipts_expense_id ON receipts(expense_id);

-- VOICE MEMOS
CREATE TABLE IF NOT EXISTS voice_memos (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade,
  audio_url text,
  transcript text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE voice_memos ENABLE ROW LEVEL SECURITY;

-- Create policies for voice_memos
CREATE POLICY "Users can view their own voice memos"
    ON voice_memos FOR SELECT
    USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = voice_memos.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can insert their own voice memos"
    ON voice_memos FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = voice_memos.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can update their own voice memos"
    ON voice_memos FOR UPDATE
    USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = voice_memos.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can delete their own voice memos"
    ON voice_memos FOR DELETE
    USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = voice_memos.expense_id AND expenses.user_id = auth.uid()));

-- Create indexes for voice_memos
CREATE INDEX idx_voice_memos_expense_id ON voice_memos(expense_id);

-- RECURRING PATTERNS
CREATE TABLE IF NOT EXISTS recurring_patterns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  merchant_id uuid references merchants(id),
  merchant_name text,
  category text,
  avg_amount numeric,
  frequency text, -- e.g., 'monthly', 'weekly'
  next_due date,
  is_subscription boolean default true,
  confidence numeric default 0.5, -- confidence score from 0 to 1
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE recurring_patterns ENABLE ROW LEVEL SECURITY;

-- Create policies for recurring_patterns
CREATE POLICY "Users can view their own recurring patterns"
    ON recurring_patterns FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring patterns"
    ON recurring_patterns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring patterns"
    ON recurring_patterns FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring patterns"
    ON recurring_patterns FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for recurring_patterns
CREATE INDEX idx_recurring_patterns_user_id ON recurring_patterns(user_id);
CREATE INDEX idx_recurring_patterns_merchant_id ON recurring_patterns(merchant_id);

-- AR RECEIPT OVERLAYS
CREATE TABLE IF NOT EXISTS ar_receipt_overlays (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid references receipts(id) on delete cascade,
  metadata jsonb, -- e.g., { "product": "Air Fryer", "price": 100 }
  highlights text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE ar_receipt_overlays ENABLE ROW LEVEL SECURITY;

-- Create policies for ar_receipt_overlays
CREATE POLICY "Users can view their own AR receipt overlays"
    ON ar_receipt_overlays FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM receipts 
      JOIN expenses ON receipts.expense_id = expenses.id 
      WHERE receipts.id = ar_receipt_overlays.receipt_id AND expenses.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own AR receipt overlays"
    ON ar_receipt_overlays FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM receipts 
      JOIN expenses ON receipts.expense_id = expenses.id 
      WHERE receipts.id = ar_receipt_overlays.receipt_id AND expenses.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own AR receipt overlays"
    ON ar_receipt_overlays FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM receipts 
      JOIN expenses ON receipts.expense_id = expenses.id 
      WHERE receipts.id = ar_receipt_overlays.receipt_id AND expenses.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own AR receipt overlays"
    ON ar_receipt_overlays FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM receipts 
      JOIN expenses ON receipts.expense_id = expenses.id 
      WHERE receipts.id = ar_receipt_overlays.receipt_id AND expenses.user_id = auth.uid()
    ));

-- Create indexes for ar_receipt_overlays
CREATE INDEX idx_ar_receipt_overlays_receipt_id ON ar_receipt_overlays(receipt_id);

-- EXPENSE INTERACTIONS
CREATE TABLE IF NOT EXISTS expense_interactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  interaction_type text check (interaction_type in ('tap-entry', 'voice', 'scan', 'suggestion')),
  context jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE expense_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for expense_interactions
CREATE POLICY "Users can view their own expense interactions"
    ON expense_interactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense interactions"
    ON expense_interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense interactions"
    ON expense_interactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense interactions"
    ON expense_interactions FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for expense_interactions
CREATE INDEX idx_expense_interactions_user_id ON expense_interactions(user_id);
CREATE INDEX idx_expense_interactions_type ON expense_interactions(interaction_type);

-- Add merchant intelligence table for spending pattern analysis
CREATE TABLE IF NOT EXISTS merchant_intelligence (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  merchant_name text not null,
  category_id text,
  visit_count integer default 1,
  average_spend numeric,
  last_visit_date date,
  insights jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE merchant_intelligence ENABLE ROW LEVEL SECURITY;

-- Create policies for merchant_intelligence
CREATE POLICY "Users can view their own merchant intelligence"
    ON merchant_intelligence FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own merchant intelligence"
    ON merchant_intelligence FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant intelligence"
    ON merchant_intelligence FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own merchant intelligence"
    ON merchant_intelligence FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for merchant_intelligence
CREATE INDEX idx_merchant_intelligence_user_id ON merchant_intelligence(user_id);
CREATE INDEX idx_merchant_intelligence_merchant_name ON merchant_intelligence(merchant_name);

-- Add time analysis table for time-of-day spending patterns
CREATE TABLE IF NOT EXISTS time_analysis (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  transaction_id uuid references expenses(id) on delete cascade,
  time_of_day text,
  day_of_week text,
  is_impulse boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE time_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for time_analysis
CREATE POLICY "Users can view their own time analysis"
    ON time_analysis FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time analysis"
    ON time_analysis FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time analysis"
    ON time_analysis FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time analysis"
    ON time_analysis FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for time_analysis
CREATE INDEX idx_time_analysis_user_id ON time_analysis(user_id);
CREATE INDEX idx_time_analysis_transaction_id ON time_analysis(transaction_id);
CREATE INDEX idx_time_analysis_time_of_day ON time_analysis(time_of_day);
CREATE INDEX idx_time_analysis_day_of_week ON time_analysis(day_of_week);
