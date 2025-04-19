# Setting Up ESG Tables for the ESG Screener Feature

The ESG screener feature requires two additional tables that don't exist yet in your Supabase database:

1. `esg_categories` - Stores the different ESG (Environmental, Social, Governance) categories for filtering investments
2. `excluded_sectors` - Stores sectors that ESG-focused investors might want to exclude from their portfolio

## Creating the Tables

### Option 1: Using the Supabase Dashboard (Recommended)

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to the SQL Editor
4. Copy and paste the SQL from `migrations/create_esg_tables.sql`
5. Run the SQL query

### Option 2: Using curl with your Service Role Key

You can run this command from your project directory:

```bash
curl -X POST https://xnkqpauwqebaogccpoxq.supabase.co/rest/v1/rpc/exec_sql \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "$(cat migrations/create_esg_tables.sql)"}'
```

## Temporary Fix

Until you create these tables, I've updated the code to use mock data for ESG categories and excluded sectors. This allows you to test the ESG screener feature without needing to set up the database tables immediately.

## Table Structures

### ESG Categories Table

The `esg_categories` table includes:

- `id`: Unique identifier for each category (e.g., 'climate_action')
- `name`: Display name for the category (e.g., 'Climate Action')
- `category`: Which ESG pillar it belongs to ('environmental', 'social', or 'governance')
- `description`: Brief description of the category

The migration script includes 24 sample ESG categories across all three pillars.

### Excluded Sectors Table

The `excluded_sectors` table includes:

- `id`: Unique identifier for each sector (e.g., 'fossil_fuels')
- `name`: Display name for the sector (e.g., 'Fossil Fuels')
- `description`: Brief description of why investors might exclude this sector

The migration script includes 10 common sectors that ESG-focused investors often exclude.

## Integration with the ESG Screener

Once these tables are created, the ESG screener will automatically use them to:

1. Display filtering options for ESG categories
2. Allow users to exclude specific sectors from their investment universe
3. Show detailed information about each ESG category and excluded sector
