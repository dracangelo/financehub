-- Migration: Add missing columns to debts table
-- Description: Adds account_number, lender, and notes columns to the debts table

-- Check if the table exists first
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debts') THEN
    -- Add account_number column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'debts' 
                  AND column_name = 'account_number') THEN
      ALTER TABLE public.debts ADD COLUMN account_number TEXT;
    END IF;
    
    -- Add lender column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'debts' 
                  AND column_name = 'lender') THEN
      ALTER TABLE public.debts ADD COLUMN lender TEXT;
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'debts' 
                  AND column_name = 'notes') THEN
      ALTER TABLE public.debts ADD COLUMN notes TEXT;
    END IF;
    
    -- Add payment_method_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'debts' 
                  AND column_name = 'payment_method_id') THEN
      ALTER TABLE public.debts ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;
    END IF;
    
    -- Add autopay column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'debts' 
                  AND column_name = 'autopay') THEN
      ALTER TABLE public.debts ADD COLUMN autopay BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add actual_payment column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'debts' 
                  AND column_name = 'actual_payment') THEN
      ALTER TABLE public.debts ADD COLUMN actual_payment NUMERIC DEFAULT 0;
    END IF;
    
    -- Add balance column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'debts' 
                  AND column_name = 'balance') THEN
      ALTER TABLE public.debts ADD COLUMN balance NUMERIC DEFAULT 0;
    END IF;
    
    -- Check principal column exists and has NOT NULL constraint
    IF EXISTS (SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = 'debts' 
              AND column_name = 'principal') THEN
      -- Make sure principal has NOT NULL constraint
      ALTER TABLE public.debts ALTER COLUMN principal SET NOT NULL;
    ELSE
      -- Add principal column if it doesn't exist
      ALTER TABLE public.debts ADD COLUMN principal NUMERIC NOT NULL DEFAULT 0;
    END IF;
    
    -- Add original_balance column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'debts' 
                  AND column_name = 'original_balance') THEN
      ALTER TABLE public.debts ADD COLUMN original_balance NUMERIC DEFAULT 0;
    END IF;
    
    -- Add estimated_payoff_date column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'debts' 
                  AND column_name = 'estimated_payoff_date') THEN
      ALTER TABLE public.debts ADD COLUMN estimated_payoff_date DATE;
    END IF;
    
    -- Check and modify due_date column if it exists and is not of type DATE
    DECLARE
      column_type TEXT;
    BEGIN
      SELECT data_type INTO column_type FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'debts' AND column_name = 'due_date';
      
      IF column_type IS NOT NULL AND column_type <> 'date' THEN
        -- If due_date exists but is not a DATE type, alter it
        ALTER TABLE public.debts ALTER COLUMN due_date TYPE DATE USING NULL;
      ELSIF column_type IS NULL THEN
        -- If due_date doesn't exist, add it
        ALTER TABLE public.debts ADD COLUMN due_date DATE;
      END IF;
    END;
  ELSE
    RAISE NOTICE 'Table public.debts does not exist. Migration skipped.';
  END IF;
END $$;