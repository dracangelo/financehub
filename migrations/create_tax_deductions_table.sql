-- Migration: Create Tax Deductions Table
-- This script creates the tax_deductions table for storing user tax deductions

-- First, drop the table if it exists to ensure a clean creation
DROP TABLE IF EXISTS "tax_deductions";

-- Create the tax_deductions table
CREATE TABLE "tax_deductions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "max_amount" DECIMAL(12,2),
  "category_id" TEXT,
  "tax_year" TEXT NOT NULL,
  "notes" TEXT,
  "date_added" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to the table
COMMENT ON TABLE "tax_deductions" IS 'Stores tax deductions for users';

-- Create indexes
CREATE INDEX "tax_deductions_user_id_idx" ON "tax_deductions" ("user_id");
CREATE INDEX "tax_deductions_created_at_idx" ON "tax_deductions" ("created_at");
CREATE INDEX "tax_deductions_tax_year_idx" ON "tax_deductions" ("tax_year");

-- Set up Row Level Security (RLS)
ALTER TABLE "tax_deductions" ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select only their own deductions
CREATE POLICY "Users can view their own tax deductions" 
  ON "tax_deductions" 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own deductions
CREATE POLICY "Users can insert their own tax deductions" 
  ON "tax_deductions" 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own deductions
CREATE POLICY "Users can update their own tax deductions" 
  ON "tax_deductions" 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own deductions
CREATE POLICY "Users can delete their own tax deductions" 
  ON "tax_deductions" 
  FOR DELETE 
  USING (auth.uid() = user_id);