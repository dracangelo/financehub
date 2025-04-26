-- Create reports table for storing generated financial reports
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  format TEXT NOT NULL,
  time_range TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS reports_type_idx ON public.reports(type);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports(created_at);

-- Add RLS policies
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy for selecting reports (users can only view their own reports)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can view their own reports'
  ) THEN
    CREATE POLICY "Users can view their own reports"
      ON public.reports
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy for inserting reports (users can only insert their own reports)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can insert their own reports'
  ) THEN
    CREATE POLICY "Users can insert their own reports"
      ON public.reports
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy for updating reports (users can only update their own reports)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can update their own reports'
  ) THEN
    CREATE POLICY "Users can update their own reports"
      ON public.reports
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy for deleting reports (users can only delete their own reports)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can delete their own reports'
  ) THEN
    CREATE POLICY "Users can delete their own reports"
      ON public.reports
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
