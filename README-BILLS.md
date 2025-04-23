# Bills Management Feature - Setup Guide

This guide provides instructions for setting up the bills management feature in the FinanceHub application. The bills management system allows users to track, manage, and receive reminders for their bills and recurring payments.

## Database Tables

The bills management feature uses the following tables:

1. **bills** - Stores information about individual bills
2. **bill_categories** - Stores categories for bills (e.g., Utilities, Rent, Insurance)
3. **bill_schedules** - Stores scheduled occurrences for recurring bills
4. **bill_reminders** - Stores reminders for upcoming bills
5. **payments** - Stores payment records for bills

## Setup Options

You have two options for setting up the bills management database tables:

### Option 1: Using the Supabase Dashboard (SQL Editor)

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy the contents of `migrations/create_bills_tables.sql`
5. Run the SQL query

### Option 2: Using the Migration Script

You can run the migration script programmatically:

1. Navigate to the project root directory
2. Run the migration script:

```bash
node scripts/run-migrations.js --file=migrations/create_bills_tables.sql
```

## Table Structure

### bills

| Column         | Type                    | Description                           |
|----------------|-------------------------|---------------------------------------|
| id             | UUID                    | Primary key                           |
| user_id        | UUID                    | Reference to auth.users(id)           |
| name           | TEXT                    | Bill name                             |
| category       | TEXT                    | Bill category                         |
| amount         | DECIMAL(12,2)           | Bill amount                           |
| due_date       | TIMESTAMP WITH TIME ZONE| Due date                              |
| is_recurring   | BOOLEAN                 | Whether the bill recurs               |
| frequency      | TEXT                    | Recurrence frequency (if recurring)   |
| payment_method | TEXT                    | Payment method                        |
| status         | TEXT                    | Status (pending, paid, overdue)       |
| notes          | TEXT                    | Additional notes                      |
| reminder_days  | INTEGER                 | Days before due date to send reminder |
| attachments    | TEXT[]                  | Array of attachment URLs              |
| tags           | TEXT[]                  | Array of tags                         |
| created_at     | TIMESTAMP WITH TIME ZONE| Creation timestamp                    |
| updated_at     | TIMESTAMP WITH TIME ZONE| Last update timestamp                 |

### bill_categories

| Column      | Type                    | Description                           |
|-------------|-------------------------|---------------------------------------|
| id          | UUID                    | Primary key                           |
| name        | TEXT                    | Category name                         |
| color       | TEXT                    | Color code for UI display             |
| icon        | TEXT                    | Icon name for UI display              |
| description | TEXT                    | Category description                  |
| is_default  | BOOLEAN                 | Whether this is a default category    |
| user_id     | UUID                    | Reference to auth.users(id) if custom |
| created_at  | TIMESTAMP WITH TIME ZONE| Creation timestamp                    |
| updated_at  | TIMESTAMP WITH TIME ZONE| Last update timestamp                 |

### bill_schedules

| Column          | Type                    | Description                           |
|-----------------|-------------------------|---------------------------------------|
| id              | UUID                    | Primary key                           |
| user_id         | UUID                    | Reference to auth.users(id)           |
| original_bill_id| UUID                    | Reference to bills(id)                |
| name            | TEXT                    | Bill name                             |
| category        | TEXT                    | Bill category                         |
| amount          | DECIMAL(12,2)           | Bill amount                           |
| due_date        | TIMESTAMP WITH TIME ZONE| Due date                              |
| frequency       | TEXT                    | Recurrence frequency                  |
| payment_method  | TEXT                    | Payment method                        |
| status          | TEXT                    | Status (pending, paid, overdue)       |
| notes           | TEXT                    | Additional notes                      |
| reminder_days   | INTEGER                 | Days before due date to send reminder |
| created_at      | TIMESTAMP WITH TIME ZONE| Creation timestamp                    |
| updated_at      | TIMESTAMP WITH TIME ZONE| Last update timestamp                 |

### bill_reminders

| Column        | Type                    | Description                           |
|---------------|-------------------------|---------------------------------------|
| id            | UUID                    | Primary key                           |
| user_id       | UUID                    | Reference to auth.users(id)           |
| bill_id       | UUID                    | Reference to bills(id)                |
| reminder_date | TIMESTAMP WITH TIME ZONE| When to send the reminder             |
| reminder_type | TEXT                    | Type (email, push, sms, in_app)       |
| message       | TEXT                    | Reminder message                      |
| is_active     | BOOLEAN                 | Whether the reminder is active        |
| is_sent       | BOOLEAN                 | Whether the reminder has been sent    |
| created_at    | TIMESTAMP WITH TIME ZONE| Creation timestamp                    |
| updated_at    | TIMESTAMP WITH TIME ZONE| Last update timestamp                 |

## API Routes

The bills management feature provides the following API routes:

### Bills

- `GET /api/bills` - Get all bills for the current user
- `POST /api/bills` - Create a new bill
- `GET /api/bills/[billId]` - Get a specific bill
- `PATCH /api/bills/[billId]` - Update a bill
- `DELETE /api/bills/[billId]` - Delete a bill

### Bill Categories

- `GET /api/bills/categories` - Get all bill categories
- `POST /api/bills/categories` - Create a new bill category
- `PATCH /api/bills/categories` - Update a bill category
- `DELETE /api/bills/categories` - Delete a bill category

### Bill Schedules

- `GET /api/bills/schedules` - Get all scheduled bills
- `POST /api/bills/schedules` - Create a new scheduled bill
- `PATCH /api/bills/schedules` - Update a scheduled bill
- `DELETE /api/bills/schedules` - Delete a scheduled bill

### Bill Reminders

- `GET /api/bills/reminders` - Get all bill reminders
- `POST /api/bills/reminders` - Create a new bill reminder
- `PATCH /api/bills/reminders` - Update a bill reminder
- `DELETE /api/bills/reminders` - Delete a bill reminder

## Error Handling

All API routes include proper error handling for:

1. Missing tables (automatically creates them)
2. Authentication errors
3. Database errors
4. Validation errors

## Default Data

The migration script includes default bill categories:

1. Utilities
2. Rent/Mortgage
3. Insurance
4. Internet
5. Phone
6. Groceries
7. Transportation
8. Entertainment
9. Medical
10. Education

## Security

Row-Level Security (RLS) policies are implemented for all tables to ensure users can only access their own data. Default categories are visible to all users, but only the user who created a custom category can modify or delete it.
