-- For columns that have NOT NULL constraint, first add them without the constraint
ALTER TABLE IF EXISTS tax_documents
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_metadata_id UUID,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows with default values
UPDATE tax_documents 
SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;

UPDATE tax_documents 
SET name = 'Unnamed Document' WHERE name IS NULL;

UPDATE tax_documents 
SET file_url = 'placeholder_url' WHERE file_url IS NULL;

UPDATE tax_documents 
SET file_name = 'placeholder.pdf' WHERE file_name IS NULL;

UPDATE tax_documents 
SET document_type = 'unknown' WHERE document_type IS NULL;

UPDATE tax_documents 
SET due_date = '2025-12-31' WHERE due_date IS NULL;

UPDATE tax_documents 
SET status = 'pending' WHERE status IS NULL;

-- Now add NOT NULL constraints after data has been populated
ALTER TABLE tax_documents 
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN file_url SET NOT NULL,
ALTER COLUMN file_name SET NOT NULL,
ALTER COLUMN document_type SET NOT NULL,
ALTER COLUMN due_date SET NOT NULL,
ALTER COLUMN status SET NOT NULL;

-- Add index on user_id for better performance
CREATE INDEX IF NOT EXISTS tax_documents_user_id_idx ON tax_documents(user_id);

-- Add index on document_type for filtering
CREATE INDEX IF NOT EXISTS tax_documents_type_idx ON tax_documents(document_type);