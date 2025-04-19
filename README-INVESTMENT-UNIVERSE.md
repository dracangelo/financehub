# Setting Up the Investment Universe Database Table

The ESG screener feature requires an `investment_universe` table that doesn't exist yet in your Supabase database. This table is used to store information about available investments for screening and adding to your watchlist.

## Creating the Table

### Option 1: Using the Supabase Dashboard (Recommended)

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to the SQL Editor
4. Copy and paste the SQL from `migrations/create_investment_universe_table.sql`
5. Run the SQL query

### Option 2: Using the Migration Script

If you have the Supabase service role key, you can run this SQL directly:

```bash
# First, make sure you're in the project directory
cd c:\Users\kelvi.DRAC\Downloads\projects\react\funds

# Then run this command to execute the SQL file against your Supabase database
curl -X POST https://xnkqpauwqebaogccpoxq.supabase.co/rest/v1/rpc/exec_sql \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhua3FwYXV3cWViYW9nY2Nwb3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE3MzY5NiwiZXhwIjoyMDU5NzQ5Njk2fQ.u1nCYRkPNhkkIREsq1SZEdpx-AlBR76vtEF8kZVpFDU" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhua3FwYXV3cWViYW9nY2Nwb3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE3MzY5NiwiZXhwIjoyMDU5NzQ5Njk2fQ.u1nCYRkPNhkkIREsq1SZEdpx-AlBR76vtEF8kZVpFDU" \
  -H "Content-Type: application/json" \
  -d '{"query": "$(cat migrations/create_investment_universe_table.sql)"}'
```

## Temporary Fix

Until you create the table, I've updated the code to use mock data for the investment universe. This allows you to test the ESG screener and watchlist features without needing to set up the database table immediately.

## Table Structure

The `investment_universe` table includes the following fields:

- `id`: Unique identifier for each investment
- `ticker`: Stock ticker symbol
- `name`: Company name
- `sector_id`: Industry sector identifier
- `industry`: Specific industry classification
- `market_cap`: Market capitalization in USD
- `price`: Current stock price
- `dividend_yield`: Dividend yield percentage
- `pe_ratio`: Price-to-earnings ratio
- `esg_score`: JSON object with environmental, social, governance, and total scores
- `esg_categories`: Array of ESG categories the company excels in
- `description`: Brief company description

The table also includes sample data for 20 companies with realistic ESG scores and categories to get you started.
