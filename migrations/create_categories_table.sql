-- Create Categories Table Migration Script
-- This script creates the categories table needed for transaction categorization

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT,
  is_income BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
CREATE INDEX IF NOT EXISTS categories_is_income_idx ON categories(is_income);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories table
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Create stored procedure for table creation
CREATE OR REPLACE FUNCTION create_categories_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT,
    is_income BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Add indexes
  CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
  CREATE INDEX IF NOT EXISTS categories_is_income_idx ON categories(is_income);
  
  -- Enable RLS
  ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  CREATE POLICY "Users can view their own categories"
    ON categories FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own categories"
    ON categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own categories"
    ON categories FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own categories"
    ON categories FOR DELETE
    USING (auth.uid() = user_id);
END;
$$;

-- Insert default categories
INSERT INTO categories (id, user_id, name, color, icon, is_income, created_at, updated_at)
VALUES
  -- Income categories
  (uuid_generate_v4(), auth.uid(), 'Salary', '#10b981', 'cash', true, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Investments', '#3b82f6', 'trending-up', true, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Freelance', '#8b5cf6', 'briefcase', true, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Gifts', '#ec4899', 'gift', true, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Other Income', '#6b7280', 'plus-circle', true, NOW(), NOW()),
  
  -- Expense categories
  (uuid_generate_v4(), auth.uid(), 'Housing', '#ef4444', 'home', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Food', '#f59e0b', 'utensils', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Transportation', '#84cc16', 'car', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Utilities', '#06b6d4', 'bolt', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Insurance', '#8b5cf6', 'shield', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Healthcare', '#ec4899', 'heart', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Entertainment', '#f97316', 'film', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Shopping', '#14b8a6', 'shopping-bag', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Personal Care', '#8b5cf6', 'user', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Education', '#0ea5e9', 'book', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Gifts & Donations', '#ec4899', 'gift', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Travel', '#6366f1', 'plane', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Subscriptions', '#0284c7', 'repeat', false, NOW(), NOW()),
  (uuid_generate_v4(), auth.uid(), 'Other Expenses', '#6b7280', 'more-horizontal', false, NOW(), NOW())
ON CONFLICT DO NOTHING;
