# Expenses Table Schema Update

This document provides instructions for updating the expenses table schema in Supabase to fix the "Could not find the 'merchant_name' column" error.

## Background

The application is attempting to use a `merchant_name` column in the expenses table, but this column doesn't exist in your Supabase database schema. This is causing errors when creating new expenses.

## Solution

There are two ways to fix this issue:

### Option 1: Add the column through the Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to your project
3. Go to the "Table Editor" section
4. Select the "expenses" table
5. Click on "Edit table"
6. Click "Add column"
7. Enter the following details:
   - Name: `merchant_name`
   - Type: `text`
   - Default Value: `null`
   - Check "Is Nullable"
8. Click "Save"

### Option 2: Use the Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Go to the "SQL Editor" section
3. Create a new query
4. Enter the following SQL:

```sql
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS merchant_name TEXT;
```

5. Click "Run" to execute the query

## Code Fix (Already Implemented)

As a fallback, we've already updated the `createExpense` function in `app/actions/expenses.ts` to handle the case when the `merchant_name` column doesn't exist. The function now omits this field from the insert data, which should allow expense creation to work even without the column.

## Testing

After implementing either of the above solutions:

1. Try creating a new expense through the application
2. If you still encounter issues, check the browser console for any error messages
3. Verify that the expense was created successfully in the Supabase dashboard

## Additional Notes

If you need to store merchant information, consider creating a separate `merchants` table with a proper relationship to the `expenses` table. This would be a more structured approach for a production application.
