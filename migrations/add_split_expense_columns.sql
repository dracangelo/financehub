-- Migration script to add split expense columns to the expenses table
-- Run this in the Supabase SQL Editor

-- Add split_with_name column if it doesn't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS split_with_name TEXT;

-- Add split_amount column if it doesn't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS split_amount NUMERIC;

-- Comment on columns to document their purpose
COMMENT ON COLUMN expenses.split_with_name IS 'Name of the person the expense is split with';
COMMENT ON COLUMN expenses.split_amount IS 'Amount that the other person owes for this expense';
