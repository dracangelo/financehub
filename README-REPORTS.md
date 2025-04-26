# Reports Table Setup

This document provides instructions for setting up the reports table in your Supabase database for the FinanceHub application.

## Table Purpose

The `reports` table stores information about generated financial reports, including:

- Report metadata (title, description, type, format)
- Report status (pending, processing, completed, failed)
- File URLs for completed reports
- User associations for proper data isolation

## Setup Options

### Option 1: Using the Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `migrations/create_reports_table.sql`
5. Run the query

### Option 2: Using the Migration Script

If you have the Supabase service role key, you can run the migration script:

```bash
# Make sure you have the required environment variables in your .env file:
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

node scripts/run-reports-migration.js
```

## Table Structure

The reports table has the following structure:

| Column        | Type      | Description                                      |
|---------------|-----------|--------------------------------------------------|
| id            | UUID      | Primary key                                      |
| user_id       | UUID      | Foreign key to auth.users                        |
| title         | TEXT      | Report title                                     |
| description   | TEXT      | Optional report description                      |
| type          | TEXT      | Report type (overview, income-expense, etc.)     |
| format        | TEXT      | File format (pdf, csv, excel)                    |
| time_range    | TEXT      | Time range for the report data                   |
| file_url      | TEXT      | URL to the generated report file                 |
| created_at    | TIMESTAMP | Creation timestamp                               |
| status        | TEXT      | Report status (pending, processing, completed, failed) |
| error_message | TEXT      | Error message if generation failed               |

## Row Level Security

The table is configured with Row Level Security (RLS) policies to ensure users can only access their own reports:

- Users can view their own reports
- Users can insert their own reports
- Users can update their own reports
- Users can delete their own reports

## Indexes

The following indexes are created for better query performance:

- `reports_user_id_idx` on `user_id`
- `reports_type_idx` on `type`
- `reports_status_idx` on `status`
- `reports_created_at_idx` on `created_at`
