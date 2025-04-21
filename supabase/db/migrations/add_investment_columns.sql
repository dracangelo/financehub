-- Add new columns to the investments table
ALTER TABLE investments ADD COLUMN IF NOT EXISTS quantity numeric;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS initial_price numeric;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS current_price numeric;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS updated_at timestamp default now();

-- Comment the columns
COMMENT ON COLUMN investments.quantity IS 'number of shares, bonds, etc.';
COMMENT ON COLUMN investments.initial_price IS 'initial buying price per unit';
COMMENT ON COLUMN investments.current_price IS 'current market price per unit';
