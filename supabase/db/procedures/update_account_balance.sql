-- Create a function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance(
  p_account_id UUID,
  p_amount_change DECIMAL
)
RETURNS VOID AS $$
BEGIN
  -- Update the account balance
  UPDATE accounts
  SET balance = balance + p_amount_change
  WHERE id = p_account_id;
END;
$$ LANGUAGE plpgsql;

