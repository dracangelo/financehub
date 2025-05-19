-- Function to ensure all required columns exist in the debts table
CREATE OR REPLACE FUNCTION ensure_debts_columns_exist()
RETURNS BOOLEAN AS $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if the type column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'debts' AND column_name = 'type'
  ) INTO column_exists;
  
  -- Add the type column if it doesn't exist
  IF NOT column_exists THEN
    EXECUTE 'ALTER TABLE debts ADD COLUMN type TEXT DEFAULT ''personal_loan''';
  END IF;
  
  -- Add other required columns if they don't exist
  -- Check and add current_balance column
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'debts' AND column_name = 'current_balance'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    EXECUTE 'ALTER TABLE debts ADD COLUMN current_balance NUMERIC DEFAULT 0';
  END IF;
  
  -- Check and add interest_rate column
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'debts' AND column_name = 'interest_rate'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    EXECUTE 'ALTER TABLE debts ADD COLUMN interest_rate NUMERIC DEFAULT 0';
  END IF;
  
  -- Check and add minimum_payment column
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'debts' AND column_name = 'minimum_payment'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    EXECUTE 'ALTER TABLE debts ADD COLUMN minimum_payment NUMERIC DEFAULT 0';
  END IF;
  
  -- Check and add loan_term column
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'debts' AND column_name = 'loan_term'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    EXECUTE 'ALTER TABLE debts ADD COLUMN loan_term INTEGER';
  END IF;
  
  -- Refresh the PostgREST schema cache
  NOTIFY pgrst, 'reload schema';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh the PostgREST schema cache
CREATE OR REPLACE FUNCTION refresh_postgrest_schema()
RETURNS VOID AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;

-- Function to execute arbitrary SQL (for admin use only)
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql;
