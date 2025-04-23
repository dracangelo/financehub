# Categories Feature - Setup Guide

This guide provides instructions for setting up the transaction categories feature in the FinanceHub application. The categories system allows users to organize their financial transactions by type and track spending patterns.

## Database Tables

The categories feature uses the following table:

1. **categories** - Stores information about transaction categories (both income and expense)

## Setup Options

You have two options for setting up the categories database table:

### Option 1: Using the Supabase Dashboard (SQL Editor)

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy the contents of `migrations/create_categories_table.sql`
5. Run the SQL query

### Option 2: Using the Migration Script

You can run the migration script programmatically:

1. Navigate to the project root directory
2. Run the migration script:

```bash
node scripts/run-migrations.js --file=migrations/create_categories_table.sql
```

## Table Structure

### categories

| Column     | Type                    | Description                           |
|------------|-------------------------|---------------------------------------|
| id         | UUID                    | Primary key                           |
| user_id    | UUID                    | Reference to auth.users(id)           |
| name       | TEXT                    | Category name                         |
| color      | TEXT                    | Color code for UI display             |
| icon       | TEXT                    | Icon name for UI display              |
| is_income  | BOOLEAN                 | Whether this is an income category    |
| created_at | TIMESTAMP WITH TIME ZONE| Creation timestamp                    |
| updated_at | TIMESTAMP WITH TIME ZONE| Last update timestamp                 |

## Default Categories

The migration script includes default categories for both income and expenses:

### Income Categories
- Salary
- Investments
- Freelance
- Gifts
- Other Income

### Expense Categories
- Housing
- Food
- Transportation
- Utilities
- Insurance
- Healthcare
- Entertainment
- Shopping
- Personal Care
- Education
- Gifts & Donations
- Travel
- Subscriptions
- Other Expenses

## API Functions

The categories feature provides the following server actions:

- `getCategories()` - Get all categories for the current user
- `ensureStaticCategories()` - Ensure default categories exist for the user
- `initializeUserCategories(userId)` - Initialize default categories for a new user
- `getCategoryById(id)` - Get a specific category by ID
- `createCategory(formData)` - Create a new category
- `updateCategory(id, formData)` - Update an existing category
- `deleteCategory(id)` - Delete a category
- `getCategorySpending(period)` - Get spending by category for a specific time period

## Error Handling

All API functions include proper error handling for:

1. Missing tables (automatically creates them)
2. Authentication errors
3. Database errors
4. Validation errors

## Security

Row-Level Security (RLS) policies are implemented to ensure users can only access their own categories. Each user will see only the categories they have created.
