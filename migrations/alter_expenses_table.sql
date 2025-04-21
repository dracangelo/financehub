-- Migration script to add missing columns to the expenses table
-- Run this in the Supabase SQL Editor

-- Add merchant_name column if it doesn't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS merchant_name TEXT;

-- Add notes column if it doesn't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add receipt_url column if it doesn't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Add warranty_expiry column if it doesn't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS warranty_expiry TIMESTAMP WITH TIME ZONE;

-- Add is_impulse column if it doesn't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_impulse BOOLEAN DEFAULT FALSE;

-- Add is_recurring column if it doesn't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Add location column if it doesn't exist (for storing geographic coordinates)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT);

-- Comment on columns to document their purpose
COMMENT ON COLUMN expenses.merchant_name IS 'Name of the merchant or vendor';
COMMENT ON COLUMN expenses.notes IS 'Additional notes or details about the expense';
COMMENT ON COLUMN expenses.receipt_url IS 'URL or reference to the receipt image';
COMMENT ON COLUMN expenses.warranty_expiry IS 'Date when the warranty expires for this purchase';
COMMENT ON COLUMN expenses.is_impulse IS 'Whether this was an impulse purchase';
COMMENT ON COLUMN expenses.is_recurring IS 'Whether this is a recurring expense';
COMMENT ON COLUMN expenses.location IS 'Geographic location where the expense occurred';
