-- Create tax_impact_predictions table if it doesn't exist
CREATE TABLE IF NOT EXISTS tax_impact_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    decision_type VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_tax_impact DECIMAL(12, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on user_id for better performance
CREATE INDEX IF NOT EXISTS tax_impact_predictions_user_id_idx ON tax_impact_predictions(user_id);

-- Add index on decision_type for filtering
CREATE INDEX IF NOT EXISTS tax_impact_predictions_type_idx ON tax_impact_predictions(decision_type);

-- Enable row-level security
ALTER TABLE tax_impact_predictions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own predictions
CREATE POLICY tax_impact_predictions_select_policy 
    ON tax_impact_predictions FOR SELECT 
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert only their own predictions
CREATE POLICY tax_impact_predictions_insert_policy 
    ON tax_impact_predictions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update only their own predictions
CREATE POLICY tax_impact_predictions_update_policy 
    ON tax_impact_predictions FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete only their own predictions
CREATE POLICY tax_impact_predictions_delete_policy 
    ON tax_impact_predictions FOR DELETE 
    USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before an update
CREATE TRIGGER update_tax_predictions_modtime
    BEFORE UPDATE ON tax_impact_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
