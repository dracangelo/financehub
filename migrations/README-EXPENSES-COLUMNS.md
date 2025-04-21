# Expenses Table Schema Migration

This document provides instructions for updating the expenses table schema in Supabase to add missing columns required by the FinanceHub application.

## Background

The application requires several columns in the expenses table that may not exist in your current schema:

- `merchant_name`: Name of the merchant or vendor
- `notes`: Additional notes about the expense
- `receipt_url`: URL or reference to a receipt image
- `warranty_expiry`: Date when the warranty expires for this purchase
- `is_impulse`: Whether this was an impulse purchase
- `is_recurring`: Whether this is a recurring expense
- `location`: Geographic location where the expense occurred

## Solution

### Option 1: Using the Supabase SQL Editor (Recommended)

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to your project
3. Go to the "SQL Editor" section
4. Create a new query
5. Copy and paste the contents of the `alter_expenses_table.sql` file
6. Click "Run" to execute the query

### Option 2: Using the Supabase API

If you prefer to run the migration programmatically, you can use the Supabase REST API:

```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/rest/v1/rpc/run_sql' \
  -H 'apikey: YOUR_SERVICE_ROLE_KEY' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"sql_query": "ALTER TABLE expenses ADD COLUMN IF NOT EXISTS merchant_name TEXT; ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT; ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT; ALTER TABLE expenses ADD COLUMN IF NOT EXISTS warranty_expiry TIMESTAMP WITH TIME ZONE; ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_impulse BOOLEAN DEFAULT FALSE; ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE; ALTER TABLE expenses ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT);"}'
```

Replace `YOUR_PROJECT_ID` and `YOUR_SERVICE_ROLE_KEY` with your actual values.

## Code Workarounds

We've also updated the following files to handle cases where these columns might be missing:

1. `app/actions/expenses.ts`: Modified to avoid using missing columns in insert/update operations
2. `lib/receipt-utils.ts`: Updated to provide a fallback for receipt handling when storage or columns are missing

## Testing

After implementing the schema changes:

1. Try creating a new expense with all fields filled out
2. Verify that the expense is created successfully in the database
3. Try uploading a receipt for an expense
4. Check that the receipt reference is saved correctly

## Additional Notes

This schema update is part of the ongoing improvements to the FinanceHub application, which includes:

- ESG investment screener with filtering capabilities
- Investment universe database with ESG scores
- Watchlist feature with real-time stock data integration

These features require properly structured database tables with all necessary columns.
