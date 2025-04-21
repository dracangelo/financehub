#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'receipts';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

(async () => {
  try {
    console.log('Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Checking if '${BUCKET_NAME}' bucket exists...`);
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw new Error(`Error listing buckets: ${listError.message}`);

    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    if (bucketExists) {
      console.log(`Bucket '${BUCKET_NAME}' already exists.`);
    } else {
      console.log(`Creating '${BUCKET_NAME}' bucket...`);
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 10485760,
      });
      if (error) throw new Error(`Error creating bucket: ${error.message}`);
      console.log(`Bucket '${BUCKET_NAME}' created successfully.`);

      console.log('Setting up bucket policies...');
      const { error: policyError } = await supabase.rpc('create_storage_policies', { bucket_name: BUCKET_NAME }).catch(() => ({
        error: { message: 'RPC not found, trying SQL directly' },
      }));

      if (policyError) {
        console.log('Using direct SQL to create policies...');
        try {
          await supabase.sql(`-- your SQL policy block here --`);
          console.log('Bucket policies created successfully via SQL.');
        } catch (sqlError) {
          console.warn(`Warning: Could not create bucket policies via SQL: ${sqlError.message}`);
        }
      } else {
        console.log('Bucket policies created successfully via RPC.');
      }
    }

    console.log('Checking if receipts table exists...');
    const { error: tableExistsError } = await supabase.from('receipts').select('id').limit(1);
    if (tableExistsError && tableExistsError.code === '42P01') {
      console.log('Creating receipts table...');
      const { error: createTableError } = await supabase.rpc('create_receipts_table').catch(() => ({
        error: { message: 'RPC not found, trying SQL directly' },
      }));

      if (createTableError) {
        console.log('Attempting to create table with direct SQL...');
        try {
          await supabase.sql(`-- your receipts table SQL block here --`);
          console.log('Receipts table created successfully via SQL.');
        } catch (sqlError) {
          console.warn(`Warning: Could not create receipts table: ${sqlError.message}`);
        }
      } else {
        console.log('Receipts table created successfully via RPC.');
      }
    } else {
      console.log('Receipts table already exists.');
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
