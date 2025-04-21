# Fixing Receipt Upload Row-Level Security (RLS) Issues

This document provides instructions for fixing the Row-Level Security (RLS) policy issues that are preventing receipt uploads in the FinanceHub application.

## Error Description

When trying to upload a receipt, you may encounter the following error:

```
Error: Failed to upload receipt: Error uploading receipt: new row violates row-level security policy
```

This error occurs because the current user doesn't have permission to:
1. Upload files to the 'receipts' storage bucket, and/or
2. Insert records into the 'receipts' database table

## Automatic Fix

Run the provided migration script to fix the RLS policies:

```bash
node migrations/fix-receipts-rls.js
```

This script will:
- Enable RLS on the receipts table
- Create appropriate policies for the receipts table
- Update the receipts bucket settings
- Provide instructions for manual configuration if needed

## Manual Fix

If the automatic fix doesn't work, follow these steps:

### 1. Fix Database Table RLS Policies

1. Log in to your Supabase dashboard
2. Go to the "Table Editor" section
3. Select the "receipts" table
4. Click on the "Policies" tab
5. Enable Row Level Security if it's not already enabled
6. Create the following policies:

#### Select Policy
- Name: "Users can view their own receipts"
- Definition: `auth.uid() = user_id`

#### Insert Policy
- Name: "Users can insert their own receipts"
- Definition: `auth.uid() = user_id`

#### Update Policy
- Name: "Users can update their own receipts"
- Definition: `auth.uid() = user_id`

#### Delete Policy
- Name: "Users can delete their own receipts"
- Definition: `auth.uid() = user_id`

### 2. Fix Storage Bucket RLS Policies

1. Go to the "Storage" section in the Supabase dashboard
2. Select the "receipts" bucket
3. Click on the "Policies" tab
4. Create the following policies:

#### Insert Policy
- Name: "Allow authenticated uploads"
- Definition: `(auth.uid() IS NOT NULL)`
- OR use a more restrictive policy: `(auth.uid() = storage.foldername)`

#### Select Policy
- Name: "Allow authenticated downloads"
- Definition: `(auth.uid() IS NOT NULL)`
- OR use a more restrictive policy: `(auth.uid() = storage.foldername)`

#### Update Policy
- Name: "Allow authenticated updates"
- Definition: `(auth.uid() IS NOT NULL)`
- OR use a more restrictive policy: `(auth.uid() = storage.foldername)`

#### Delete Policy
- Name: "Allow authenticated deletes"
- Definition: `(auth.uid() IS NOT NULL)`
- OR use a more restrictive policy: `(auth.uid() = storage.foldername)`

## Storage Structure

The receipt upload functionality uses a folder structure based on user IDs and expense IDs:

```
receipts/
  ├── user_id_1/
  │   ├── expense_id_1/
  │   │   ├── receipt1.jpg
  │   │   └── receipt2.png
  │   └── expense_id_2/
  │       └── receipt3.pdf
  └── user_id_2/
      └── expense_id_3/
          └── receipt4.jpg
```

This structure allows for proper organization and security of receipt files.

## Testing

After implementing the fixes:

1. Try uploading a receipt for an expense
2. Check the browser console for any error messages
3. Verify that the receipt file appears in the Supabase storage bucket
4. Verify that a record is created in the receipts table

## Troubleshooting

If you continue to encounter issues:

1. Check the browser console for specific error messages
2. Verify that the user is properly authenticated
3. Ensure that the expense ID is valid
4. Check that the file format and size are supported
