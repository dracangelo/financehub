# Debt Management Table Migration

This document provides instructions for setting up the missing columns in the `debts` table in Supabase to support the debt management feature in FinanceHub.

## Migration Details

The migration script `20240424000001_add_debt_columns.sql` adds the following columns to the `debts` table:

- `account_number`: Text field to store the account number associated with the debt
- `lender`: Text field to store the name of the lender or financial institution
- `notes`: Text field for additional information about the debt
- `payment_method_id`: UUID reference to payment methods table
- `autopay`: Boolean flag to indicate if the debt is on autopay
- `actual_payment`: Numeric field to store the actual payment amount made on the debt
- `balance`: Numeric field to store the current balance of the debt
- `original_balance`: Numeric field to store the original balance when the debt was created
- `estimated_payoff_date`: Date field to store the estimated date when the debt will be paid off

## How to Apply the Migration

### Option 1: Using the Supabase Dashboard

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `20240424000001_add_debt_columns.sql`
5. Execute the query

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db push
```

This will apply all pending migrations.

## Verification

After applying the migration, you can verify that the columns were added correctly by running the following SQL query in the Supabase SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'debts' 
ORDER BY ordinal_position;
```

You should see the new columns (`account_number`, `lender`, `notes`, `payment_method_id`, and `autopay`) in the results.

## Related Files

- `app/actions/debts.ts`: Server action that interacts with the debts table
- `app/debt-management/page.tsx`: Main debt management page
