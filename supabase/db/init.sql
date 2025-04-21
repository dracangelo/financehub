-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create RLS policies for accounts table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounts_select_policy ON accounts
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY accounts_insert_policy ON accounts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY accounts_update_policy ON accounts
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY accounts_delete_policy ON accounts
  FOR DELETE
  USING (user_id = auth.uid());

-- Create RLS policies for categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_select_policy ON categories
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY categories_insert_policy ON categories
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY categories_update_policy ON categories
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY categories_delete_policy ON categories
  FOR DELETE
  USING (user_id = auth.uid());

-- Create RLS policies for transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_select_policy ON transactions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY transactions_insert_policy ON transactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY transactions_update_policy ON transactions
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY transactions_delete_policy ON transactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Create RLS policies for budgets table
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY budgets_select_policy ON budgets
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY budgets_insert_policy ON budgets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY budgets_update_policy ON budgets
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY budgets_delete_policy ON budgets
  FOR DELETE
  USING (user_id = auth.uid());

-- Create RLS policies for recurring_transactions table
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY recurring_transactions_select_policy ON recurring_transactions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY recurring_transactions_insert_policy ON recurring_transactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY recurring_transactions_update_policy ON recurring_transactions
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY recurring_transactions_delete_policy ON recurring_transactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Create RLS policies for tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY tags_select_policy ON tags
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY tags_insert_policy ON tags
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY tags_update_policy ON tags
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY tags_delete_policy ON tags
  FOR DELETE
  USING (user_id = auth.uid());

-- Create RLS policies for transaction_tags table
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY transaction_tags_select_policy ON transaction_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY transaction_tags_insert_policy ON transaction_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY transaction_tags_delete_policy ON transaction_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

