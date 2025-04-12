-- Create currency_rates table
CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    as_of_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, base_currency, target_currency, as_of_date)
);

-- Enable Row Level Security
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own currency rates"
    ON currency_rates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own currency rates"
    ON currency_rates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own currency rates"
    ON currency_rates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own currency rates"
    ON currency_rates FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_currency_rates_updated_at
    BEFORE UPDATE ON currency_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_currency_rates_user_id ON currency_rates(user_id);
CREATE INDEX idx_currency_rates_base_currency ON currency_rates(base_currency);
CREATE INDEX idx_currency_rates_target_currency ON currency_rates(target_currency);
CREATE INDEX idx_currency_rates_as_of_date ON currency_rates(as_of_date);

-- Insert some initial currency rates for the demo user
INSERT INTO currency_rates (user_id, base_currency, target_currency, rate, as_of_date)
VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'USD', 'EUR', 0.92, CURRENT_DATE),
    ('123e4567-e89b-12d3-a456-426614174000', 'USD', 'GBP', 0.79, CURRENT_DATE),
    ('123e4567-e89b-12d3-a456-426614174000', 'USD', 'JPY', 150.23, CURRENT_DATE),
    ('123e4567-e89b-12d3-a456-426614174000', 'EUR', 'USD', 1.09, CURRENT_DATE),
    ('123e4567-e89b-12d3-a456-426614174000', 'GBP', 'USD', 1.27, CURRENT_DATE),
    ('123e4567-e89b-12d3-a456-426614174000', 'JPY', 'USD', 0.0067, CURRENT_DATE)
ON CONFLICT (user_id, base_currency, target_currency, as_of_date) DO NOTHING; 