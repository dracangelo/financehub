# Receipts Storage Bucket Setup

This document provides instructions for setting up the receipts storage bucket in Supabase, which is required for the expense receipt upload functionality.

## Automatic Setup

The easiest way to set up the receipts storage bucket is to use the provided migration script:

1. Make sure your Supabase URL and service role key are set in your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Run the migration script:

```bash
node migrations/create-receipts-bucket.js
```

This script will:
- Create the 'receipts' storage bucket if it doesn't exist
- Set up appropriate security policies for the bucket
- Create the 'receipts' database table if it doesn't exist

## Manual Setup

If you prefer to set up the bucket manually through the Supabase dashboard:

1. Log in to your Supabase dashboard
2. Navigate to the Storage section
3. Click "New Bucket"
4. Name the bucket `receipts`
5. Uncheck "Public bucket" for security
6. Click "Create bucket"
7. Set up RLS (Row Level Security) policies:
   - Go to the "Policies" tab
   - Create policies for INSERT and SELECT operations
   - Ensure only authenticated users can upload and view their own files

## Database Table

The receipts functionality also requires a `receipts` table in the database. If the migration script couldn't create it automatically, you can create it manually:

1. Go to the SQL Editor in your Supabase dashboard
2. Run the following SQL:

```sql
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  url TEXT NOT NULL,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_expense FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own receipts"
  ON public.receipts
  FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own receipts"
  ON public.receipts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own receipts"
  ON public.receipts
  FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own receipts"
  ON public.receipts
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Troubleshooting

If you encounter issues with receipt uploads:

1. Check that the 'receipts' bucket exists in your Supabase storage
2. Verify that your RLS policies are correctly set up
3. Ensure your application has the correct Supabase URL and API keys
4. Check browser console for any specific error messages
