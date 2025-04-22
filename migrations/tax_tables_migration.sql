-- Create tax categories table
CREATE TABLE IF NOT EXISTS public.tax_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deduction', 'credit', 'income', 'document')),
  color TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Add row level security to tax_categories
ALTER TABLE public.tax_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see tax categories (these are global, so all users can see them)
CREATE POLICY "Users can see all tax categories" 
  ON public.tax_categories 
  FOR SELECT 
  USING (true);

-- Create tax recommendations table
CREATE TABLE IF NOT EXISTS public.tax_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deduction', 'credit', 'optimization', 'investment', 'planning')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  potential_savings DECIMAL(12, 2),
  action_items TEXT[] DEFAULT '{}',
  deadline TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Add row level security to tax_recommendations
ALTER TABLE public.tax_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own tax recommendations
CREATE POLICY "Users can only see their own tax recommendations" 
  ON public.tax_recommendations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own tax recommendations
CREATE POLICY "Users can insert their own tax recommendations" 
  ON public.tax_recommendations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own tax recommendations
CREATE POLICY "Users can update their own tax recommendations" 
  ON public.tax_recommendations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own tax recommendations
CREATE POLICY "Users can delete their own tax recommendations" 
  ON public.tax_recommendations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to update the updated_at column
CREATE TRIGGER update_tax_categories_updated_at
BEFORE UPDATE ON tax_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_recommendations_updated_at
BEFORE UPDATE ON tax_recommendations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default tax categories
INSERT INTO public.tax_categories (id, name, type, color, description)
VALUES
  (gen_random_uuid(), 'Business Expenses', 'deduction', '#4CAF50', 'Expenses related to running a business'),
  (gen_random_uuid(), 'Charitable Donations', 'deduction', '#2196F3', 'Donations to qualified charitable organizations'),
  (gen_random_uuid(), 'Medical Expenses', 'deduction', '#F44336', 'Out-of-pocket medical and dental expenses'),
  (gen_random_uuid(), 'Education Expenses', 'deduction', '#9C27B0', 'Qualified education expenses including tuition and fees'),
  (gen_random_uuid(), 'Retirement Contributions', 'deduction', '#FF9800', 'Contributions to qualified retirement accounts'),
  (gen_random_uuid(), 'Mortgage Interest', 'deduction', '#607D8B', 'Interest paid on home mortgages'),
  (gen_random_uuid(), 'State and Local Taxes', 'deduction', '#795548', 'State and local income, sales, and property taxes'),
  (gen_random_uuid(), 'Home Office', 'deduction', '#8BC34A', 'Expenses for using part of your home for business');
