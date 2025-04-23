-- Create Bills Tables Migration Script
-- This script creates all tables needed for the bills management feature

-- Create bill_categories table
CREATE TABLE IF NOT EXISTS bill_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  frequency TEXT,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  reminder_days INTEGER DEFAULT 3,
  attachments TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bill_schedules table
CREATE TABLE IF NOT EXISTS bill_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  original_bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  frequency TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  reminder_days INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bill_reminders table
CREATE TABLE IF NOT EXISTS bill_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'in_app',
  message TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(12,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
  subscription_id UUID,
  notes TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS bills_user_id_idx ON bills(user_id);
CREATE INDEX IF NOT EXISTS bills_due_date_idx ON bills(due_date);
CREATE INDEX IF NOT EXISTS bills_status_idx ON bills(status);
CREATE INDEX IF NOT EXISTS bill_schedules_user_id_idx ON bill_schedules(user_id);
CREATE INDEX IF NOT EXISTS bill_schedules_original_bill_id_idx ON bill_schedules(original_bill_id);
CREATE INDEX IF NOT EXISTS bill_reminders_user_id_idx ON bill_reminders(user_id);
CREATE INDEX IF NOT EXISTS bill_reminders_bill_id_idx ON bill_reminders(bill_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_bill_id_idx ON payments(bill_id);

-- Add Row Level Security (RLS) policies
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for bills table
CREATE POLICY "Users can view their own bills"
  ON bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills"
  ON bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
  ON bills FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for bill_schedules table
CREATE POLICY "Users can view their own bill schedules"
  ON bill_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bill schedules"
  ON bill_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bill schedules"
  ON bill_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bill schedules"
  ON bill_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for bill_reminders table
CREATE POLICY "Users can view their own bill reminders"
  ON bill_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bill reminders"
  ON bill_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bill reminders"
  ON bill_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bill reminders"
  ON bill_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for bill_categories table
CREATE POLICY "Everyone can view default bill categories"
  ON bill_categories FOR SELECT
  USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own bill categories"
  ON bill_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bill categories"
  ON bill_categories FOR UPDATE
  USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own bill categories"
  ON bill_categories FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- Insert default bill categories
INSERT INTO bill_categories (name, color, icon, description, is_default, created_at, updated_at)
VALUES
  ('Utilities', '#3b82f6', 'bolt', 'Electricity, water, gas, etc.', true, NOW(), NOW()),
  ('Rent/Mortgage', '#ef4444', 'home', 'Housing payments', true, NOW(), NOW()),
  ('Insurance', '#10b981', 'shield', 'Health, auto, home insurance', true, NOW(), NOW()),
  ('Internet', '#6366f1', 'wifi', 'Internet service provider', true, NOW(), NOW()),
  ('Phone', '#f59e0b', 'phone', 'Mobile and landline services', true, NOW(), NOW()),
  ('Groceries', '#84cc16', 'shopping-cart', 'Food and household supplies', true, NOW(), NOW()),
  ('Transportation', '#8b5cf6', 'car', 'Fuel, public transit, car payments', true, NOW(), NOW()),
  ('Entertainment', '#ec4899', 'tv', 'Streaming services, cable, etc.', true, NOW(), NOW()),
  ('Medical', '#06b6d4', 'heart', 'Healthcare expenses', true, NOW(), NOW()),
  ('Education', '#14b8a6', 'book', 'Tuition, books, courses', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Create stored procedures for table creation
CREATE OR REPLACE FUNCTION create_bills_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency TEXT,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    reminder_days INTEGER DEFAULT 3,
    attachments TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Add indexes
  CREATE INDEX IF NOT EXISTS bills_user_id_idx ON bills(user_id);
  CREATE INDEX IF NOT EXISTS bills_due_date_idx ON bills(due_date);
  CREATE INDEX IF NOT EXISTS bills_status_idx ON bills(status);
  
  -- Enable RLS
  ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  CREATE POLICY "Users can view their own bills"
    ON bills FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own bills"
    ON bills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own bills"
    ON bills FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own bills"
    ON bills FOR DELETE
    USING (auth.uid() = user_id);
END;
$$;

CREATE OR REPLACE FUNCTION create_bill_categories_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS bill_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Enable RLS
  ALTER TABLE bill_categories ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  CREATE POLICY "Everyone can view default bill categories"
    ON bill_categories FOR SELECT
    USING (is_default = true OR auth.uid() = user_id);

  CREATE POLICY "Users can insert their own bill categories"
    ON bill_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own bill categories"
    ON bill_categories FOR UPDATE
    USING (auth.uid() = user_id AND is_default = false);

  CREATE POLICY "Users can delete their own bill categories"
    ON bill_categories FOR DELETE
    USING (auth.uid() = user_id AND is_default = false);
    
  -- Insert default categories
  INSERT INTO bill_categories (name, color, icon, description, is_default, created_at, updated_at)
  VALUES
    ('Utilities', '#3b82f6', 'bolt', 'Electricity, water, gas, etc.', true, NOW(), NOW()),
    ('Rent/Mortgage', '#ef4444', 'home', 'Housing payments', true, NOW(), NOW()),
    ('Insurance', '#10b981', 'shield', 'Health, auto, home insurance', true, NOW(), NOW()),
    ('Internet', '#6366f1', 'wifi', 'Internet service provider', true, NOW(), NOW()),
    ('Phone', '#f59e0b', 'phone', 'Mobile and landline services', true, NOW(), NOW()),
    ('Groceries', '#84cc16', 'shopping-cart', 'Food and household supplies', true, NOW(), NOW()),
    ('Transportation', '#8b5cf6', 'car', 'Fuel, public transit, car payments', true, NOW(), NOW()),
    ('Entertainment', '#ec4899', 'tv', 'Streaming services, cable, etc.', true, NOW(), NOW()),
    ('Medical', '#06b6d4', 'heart', 'Healthcare expenses', true, NOW(), NOW()),
    ('Education', '#14b8a6', 'book', 'Tuition, books, courses', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION create_bill_schedules_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS bill_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    original_bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    frequency TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    reminder_days INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Add indexes
  CREATE INDEX IF NOT EXISTS bill_schedules_user_id_idx ON bill_schedules(user_id);
  CREATE INDEX IF NOT EXISTS bill_schedules_original_bill_id_idx ON bill_schedules(original_bill_id);
  
  -- Enable RLS
  ALTER TABLE bill_schedules ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  CREATE POLICY "Users can view their own bill schedules"
    ON bill_schedules FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own bill schedules"
    ON bill_schedules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own bill schedules"
    ON bill_schedules FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own bill schedules"
    ON bill_schedules FOR DELETE
    USING (auth.uid() = user_id);
END;
$$;

CREATE OR REPLACE FUNCTION create_bill_reminders_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS bill_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_type TEXT NOT NULL DEFAULT 'in_app',
    message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Add indexes
  CREATE INDEX IF NOT EXISTS bill_reminders_user_id_idx ON bill_reminders(user_id);
  CREATE INDEX IF NOT EXISTS bill_reminders_bill_id_idx ON bill_reminders(bill_id);
  
  -- Enable RLS
  ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  CREATE POLICY "Users can view their own bill reminders"
    ON bill_reminders FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own bill reminders"
    ON bill_reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own bill reminders"
    ON bill_reminders FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own bill reminders"
    ON bill_reminders FOR DELETE
    USING (auth.uid() = user_id);
END;
$$;
