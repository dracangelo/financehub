-- Migration: Create Tax Predictions Table
-- This script creates the tax_impact_predictions table for storing user tax prediction scenarios

-- Create the tax_impact_predictions table
CREATE TABLE IF NOT EXISTS "tax_impact_predictions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "decision_type" TEXT NOT NULL,
  "description" TEXT,
  "estimated_tax_impact" DECIMAL(12,2),
  "current_tax_burden" DECIMAL(12,2),
  "predicted_tax_burden" DECIMAL(12,2),
  "notes" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to the table
COMMENT ON TABLE "tax_impact_predictions" IS 'Stores tax impact predictions for different financial decisions';

-- Create indexes
CREATE INDEX IF NOT EXISTS "tax_impact_predictions_user_id_idx" ON "tax_impact_predictions" ("user_id");
CREATE INDEX IF NOT EXISTS "tax_impact_predictions_created_at_idx" ON "tax_impact_predictions" ("created_at");

-- Set up Row Level Security (RLS)
ALTER TABLE "tax_impact_predictions" ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select only their own predictions
CREATE POLICY "Users can view their own tax predictions" 
  ON "tax_impact_predictions" 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own predictions
CREATE POLICY "Users can insert their own tax predictions" 
  ON "tax_impact_predictions" 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own predictions
CREATE POLICY "Users can update their own tax predictions" 
  ON "tax_impact_predictions" 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own predictions
CREATE POLICY "Users can delete their own tax predictions" 
  ON "tax_impact_predictions" 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tax_predictions_timestamp
BEFORE UPDATE ON "tax_impact_predictions"
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
