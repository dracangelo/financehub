import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrations() {
  try {
    console.log('Starting to apply migrations...');
    
    // Apply schema fixes
    const schemaFixPath = join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20250531_fix_expenses_table.sql'
    );
    
    // Apply missing columns
    const missingColumnsPath = join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20250531_add_missing_expense_columns.sql'
    );
    
    // Read and apply all migrations
    const migrations = [schemaFixPath, missingColumnsPath];
    
    for (const migrationPath of migrations) {
      console.log(`\nApplying migration: ${migrationPath}`);
      const migrationSQL = readFileSync(migrationPath, 'utf8');
      
      console.log('Running migration...');
      const { data, error } = await supabase.rpc('pgmigrate', {
        query: migrationSQL,
      });
      
      if (error) {
        console.error('Error applying migration:', error);
        process.exit(1);
      }
      
      console.log('Migration applied successfully!');
    }
    
    console.log('All migrations applied successfully!');
    console.log('Don\'t forget to run: supabase db push');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

applyMigrations();
