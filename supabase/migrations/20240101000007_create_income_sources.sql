-- Create income_sources table
CREATE TABLE IF NOT EXISTS income_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    frequency TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    start_date DATE,
    end_date DATE,
    is_taxable BOOLEAN NOT NULL DEFAULT TRUE,
    tax_category TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own income sources"
    ON income_sources FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own income sources"
    ON income_sources FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income sources"
    ON income_sources FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income sources"
    ON income_sources FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_income_sources_updated_at
    BEFORE UPDATE ON income_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX idx_income_sources_type ON income_sources(type);
CREATE INDEX idx_income_sources_currency ON income_sources(currency);
CREATE INDEX idx_income_sources_is_taxable ON income_sources(is_taxable);

-- Insert some initial income sources for the demo user
INSERT INTO income_sources (
    id,
    user_id,
    name,
    type,
    amount,
    frequency,
    currency,
    start_date,
    is_taxable,
    tax_category,
    notes
)
VALUES
    (
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174000',
        'Primary Job',
        'primary',
        5000.00,
        'monthly',
        'USD',
        CURRENT_DATE,
        TRUE,
        'w2',
        'Main employment income'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174002',
        '123e4567-e89b-12d3-a456-426614174000',
        'Freelance Work',
        'side-hustle',
        1200.00,
        'monthly',
        'USD',
        CURRENT_DATE,
        TRUE,
        '1099',
        'Part-time freelance work'
    )
ON CONFLICT (id) DO NOTHING; 