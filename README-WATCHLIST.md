# Setting Up the Investment Watchlist Feature

The investment watchlist feature requires a database table that doesn't exist yet in your Supabase database. Here's how to set it up:

## Option 1: Using the Supabase Dashboard (Easiest)

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to the SQL Editor
4. Copy and paste the SQL from `migrations/create_watchlist_table.sql`
5. Run the SQL query

## Option 2: Using the Migration Script

If you have the Supabase service role key, you can run the migration script:

1. Make sure your `.env` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the migration script:
   ```bash
   node scripts/run-migrations.js
   ```

## Using the Watchlist Feature

Until the database table is created, the watchlist will use mock data. Once the table is created, your data will be stored persistently in the database.

The watchlist feature allows you to:

- Add investments to track with ticker, name, price, and sector information
- Set target prices and track the percentage difference
- Enable price alerts with custom thresholds
- Add notes for each investment
- Sort and filter your watchlist items
- Edit and remove items as needed

## Troubleshooting

If you see the error `relation "public.watchlist" does not exist`, it means the watchlist table hasn't been created yet. Follow the steps above to create it.

If you're using the mock data and want to switch to the database, make sure to create the table first.
