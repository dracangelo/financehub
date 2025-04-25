-- Add missing columns to tax_deductions table
ALTER TABLE IF EXISTS tax_deductions
ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES tax_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tax_year VARCHAR(4) NOT NULL DEFAULT '2024',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index on user_id for better performance
CREATE INDEX IF NOT EXISTS tax_deductions_user_id_idx ON tax_deductions(user_id);

-- Add index on category_id for better performance with joins
CREATE INDEX IF NOT EXISTS tax_deductions_category_id_idx ON tax_deductions(category_id);
