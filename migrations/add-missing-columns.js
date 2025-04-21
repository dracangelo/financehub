#!/usr/bin/env node
/**
 * Migration script to add missing columns to the expenses table
 * 
 * Usage:
 * 1. Make sure your Supabase URL and service role key are set in .env
 * 2. Run: node migrations/add-missing-columns.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

(async () => {
  try {
    console.log('Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Checking expenses table structure...');
    
    // First, check if the table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('expenses')
      .select('id')
      .limit(1)
      .catch(err => {
        return { error: err };
      });
    
    if (tableError && tableError.code === '42P01') {
      console.error('The expenses table does not exist. Please create it first.');
      process.exit(1);
    }
    
    // Use the REST API directly to execute SQL
    const executeSQL = async (sql) => {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({
            sql_query: sql
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`SQL execution failed: ${errorText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error executing SQL:', error);
        return { error };
      }
    };
    
    // Check and add merchant_name column
    console.log('Checking for merchant_name column...');
    const addMerchantNameSQL = `
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS merchant_name TEXT;
        EXCEPTION
          WHEN duplicate_column THEN
            RAISE NOTICE 'merchant_name column already exists';
        END;
      END $$;
    `;
    
    await executeSQL(addMerchantNameSQL);
    console.log('merchant_name column added or already exists.');
    
    // Check and add notes column
    console.log('Checking for notes column...');
    const addNotesSQL = `
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;
        EXCEPTION
          WHEN duplicate_column THEN
            RAISE NOTICE 'notes column already exists';
        END;
      END $$;
    `;
    
    await executeSQL(addNotesSQL);
    console.log('notes column added or already exists.');
    
    // Check and add receipt_url column
    console.log('Checking for receipt_url column...');
    const addReceiptUrlSQL = `
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;
        EXCEPTION
          WHEN duplicate_column THEN
            RAISE NOTICE 'receipt_url column already exists';
        END;
      END $$;
    `;
    
    await executeSQL(addReceiptUrlSQL);
    console.log('receipt_url column added or already exists.');
    
    // Check and add warranty_expiry column
    console.log('Checking for warranty_expiry column...');
    const addWarrantyExpirySQL = `
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS warranty_expiry TIMESTAMP WITH TIME ZONE;
        EXCEPTION
          WHEN duplicate_column THEN
            RAISE NOTICE 'warranty_expiry column already exists';
        END;
      END $$;
    `;
    
    await executeSQL(addWarrantyExpirySQL);
    console.log('warranty_expiry column added or already exists.');
    
    // Check and add is_impulse column
    console.log('Checking for is_impulse column...');
    const addIsImpulseSQL = `
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_impulse BOOLEAN DEFAULT FALSE;
        EXCEPTION
          WHEN duplicate_column THEN
            RAISE NOTICE 'is_impulse column already exists';
        END;
      END $$;
    `;
    
    await executeSQL(addIsImpulseSQL);
    console.log('is_impulse column added or already exists.');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
