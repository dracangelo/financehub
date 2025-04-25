-- Create a custom table to store file metadata
CREATE TABLE IF NOT EXISTS document_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS document_files_user_id_idx ON document_files(user_id);

-- Create an index on mime_type for filtering
CREATE INDEX IF NOT EXISTS document_files_mime_type_idx ON document_files(mime_type);

-- Create the documents bucket for tax document uploads
-- This script only creates the bucket without any policies to avoid type casting issues
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Set to false to enforce RLS policies
  false,
  10485760, -- 10MB limit
  '{image/png,image/jpeg,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet}'
)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security (only let users access their own files)
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own documents
CREATE POLICY document_files_insert_policy 
    ON document_files FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to select their own documents
CREATE POLICY document_files_select_policy 
    ON document_files FOR SELECT 
    USING (auth.uid() = user_id OR is_public = TRUE);

-- Policy to allow users to update their own documents
CREATE POLICY document_files_update_policy 
    ON document_files FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy to allow users to delete their own documents
CREATE POLICY document_files_delete_policy 
    ON document_files FOR DELETE 
    USING (auth.uid() = user_id);

-- Create RLS policies for the documents bucket

-- Policy to allow authenticated users to insert objects into the bucket
CREATE POLICY "Allow authenticated users to upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid() = owner);

-- Policy to allow users to select their own objects
CREATE POLICY "Allow users to view their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Policy to allow users to update their own objects
CREATE POLICY "Allow users to update their own documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Policy to allow users to delete their own objects
CREATE POLICY "Allow users to delete their own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before an update
CREATE TRIGGER update_document_files_modtime
    BEFORE UPDATE ON document_files
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();