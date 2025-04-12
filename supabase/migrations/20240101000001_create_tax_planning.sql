-- Create enum types for tax planning
CREATE TYPE tax_category_type AS ENUM ('income', 'deduction', 'credit', 'investment', 'retirement', 'business', 'other');
CREATE TYPE tax_document_type AS ENUM ('w2', '1099', 'receipt', 'statement', 'contract', 'other');
CREATE TYPE tax_document_status AS ENUM ('pending', 'received', 'processed', 'archived');
CREATE TYPE tax_recommendation_type AS ENUM ('optimization', 'account', 'deduction', 'timing', 'investment', 'other');
CREATE TYPE tax_recommendation_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create tax categories table
CREATE TABLE tax_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type tax_category_type NOT NULL,
    description TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, name)
);

-- Create tax deductions table
CREATE TABLE tax_deductions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES tax_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2),
    max_amount DECIMAL(10,2),
    requirements TEXT[],
    documentation_needed TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tax documents table
CREATE TABLE tax_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES tax_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type tax_document_type NOT NULL,
    status tax_document_status DEFAULT 'pending',
    file_url TEXT,
    year INTEGER NOT NULL,
    amount DECIMAL(10,2),
    notes TEXT,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tax recommendations table
CREATE TABLE tax_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type tax_recommendation_type NOT NULL,
    priority tax_recommendation_priority NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    potential_savings DECIMAL(10,2),
    action_items TEXT[],
    deadline DATE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tax timeline table
CREATE TABLE tax_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT,
    reminder_days INTEGER[],
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tax impact predictions table
CREATE TABLE tax_impact_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario TEXT NOT NULL,
    description TEXT,
    current_tax_burden DECIMAL(10,2),
    predicted_tax_burden DECIMAL(10,2),
    difference DECIMAL(10,2),
    assumptions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tax professional contacts table
CREATE TABLE tax_professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    firm TEXT,
    email TEXT,
    phone TEXT,
    specialties TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create triggers for updated_at
CREATE TRIGGER update_tax_categories_updated_at
    BEFORE UPDATE ON tax_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_deductions_updated_at
    BEFORE UPDATE ON tax_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_documents_updated_at
    BEFORE UPDATE ON tax_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_recommendations_updated_at
    BEFORE UPDATE ON tax_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_timeline_updated_at
    BEFORE UPDATE ON tax_timeline
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_impact_predictions_updated_at
    BEFORE UPDATE ON tax_impact_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_professionals_updated_at
    BEFORE UPDATE ON tax_professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE tax_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_impact_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_professionals ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own tax categories"
    ON tax_categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax categories"
    ON tax_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax categories"
    ON tax_categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax categories"
    ON tax_categories FOR DELETE
    USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view their own tax deductions"
    ON tax_deductions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax deductions"
    ON tax_deductions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax deductions"
    ON tax_deductions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax deductions"
    ON tax_deductions FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_tax_categories_user_id ON tax_categories(user_id);
CREATE INDEX idx_tax_deductions_user_id ON tax_deductions(user_id);
CREATE INDEX idx_tax_documents_user_id ON tax_documents(user_id);
CREATE INDEX idx_tax_recommendations_user_id ON tax_recommendations(user_id);
CREATE INDEX idx_tax_timeline_user_id ON tax_timeline(user_id);
CREATE INDEX idx_tax_impact_predictions_user_id ON tax_impact_predictions(user_id);
CREATE INDEX idx_tax_professionals_user_id ON tax_professionals(user_id);
CREATE INDEX idx_tax_documents_year ON tax_documents(year);
CREATE INDEX idx_tax_timeline_due_date ON tax_timeline(due_date);
CREATE INDEX idx_tax_recommendations_deadline ON tax_recommendations(deadline); 