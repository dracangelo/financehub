-- Create tax_recommendations table if it doesn't exist
CREATE TABLE IF NOT EXISTS tax_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'optimization',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    potential_savings DECIMAL(12, 2),
    action_items TEXT[],
    deadline TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS tax_recommendations_user_id_idx ON tax_recommendations(user_id);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS tax_recommendations_type_idx ON tax_recommendations(type);

-- Create index on priority for sorting
CREATE INDEX IF NOT EXISTS tax_recommendations_priority_idx ON tax_recommendations(priority);

-- Enable row-level security
ALTER TABLE tax_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own recommendations
CREATE POLICY tax_recommendations_select_policy 
    ON tax_recommendations FOR SELECT 
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert only their own recommendations
CREATE POLICY tax_recommendations_insert_policy 
    ON tax_recommendations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update only their own recommendations
CREATE POLICY tax_recommendations_update_policy 
    ON tax_recommendations FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete only their own recommendations
CREATE POLICY tax_recommendations_delete_policy 
    ON tax_recommendations FOR DELETE 
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
CREATE TRIGGER update_tax_recommendations_modtime
    BEFORE UPDATE ON tax_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
