# Database Reset Guide

This document explains how to reset your database while preserving admin user accounts.

## Overview

Two methods are available to reset the database:

1. **SQL Migration** - Run via Supabase CLI
2. **TypeScript Script** - Run via Node.js/tsx

Both methods will:
- ✅ Preserve all admin user accounts
- ✅ Preserve admin-owned resources (cars, etc.)
- ❌ Delete all non-admin users
- ❌ Delete all non-admin data (cars, rentals, verifications, etc.)

## Prerequisites

Make sure you have an admin user in your database before running any reset. The script will abort if no admin users are found.

## Method 1: SQL Migration (Recommended)

### Using Supabase CLI

1. Make sure Supabase CLI is installed and linked to your project:
   ```bash
   npx supabase link
   ```

2. Run the migration:
   ```bash
   npx supabase db push
   ```

   This will apply the migration file: `supabase/migrations/024_delete_all_except_admin.sql`

### Using SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/024_delete_all_except_admin.sql`
4. Click "Run"

## Method 2: TypeScript Script

### Setup

1. Make sure you have your environment variables set in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. The service role key can be found in:
   - Supabase Dashboard → Settings → API → Service Role Key

### Run the Script

```bash
npx tsx scripts/reset-database.ts
```

The script will:
1. Check for admin users
2. Display admin users that will be preserved
3. Ask for confirmation (type "yes" to continue)
4. Delete all non-admin data
5. Show a summary of remaining records

### Example Output

```
🔍 Checking for admin users...

✅ Found 1 admin user(s):
   - Admin User (12345678-1234-1234-1234-123456789abc)

⚠️  WARNING: This will delete ALL records except admin users!
Are you sure you want to continue? (yes/no): yes

🗑️  Starting database cleanup...

1. Deleting reminders...
   ✓ Reminders deleted
2. Deleting rental checklists...
   ✓ Rental checklists deleted
3. Deleting rentals...
   ✓ Rentals deleted
4. Deleting maintenance records...
   ✓ Maintenance records deleted
5. Deleting car pricing rules...
   ✓ Car pricing rules deleted
6. Deleting car images...
   ✓ Car images deleted
7. Deleting cars...
   ✓ Cars deleted
8. Deleting verification documents...
   ✓ Verification documents deleted
9. Deleting non-admin profiles...
   ✓ Non-admin profiles deleted

====================================
✅ Database reset complete!
====================================
Remaining records:
  - Profiles: 1
  - Cars: 0
  - Rentals: 0
====================================

✅ Script completed successfully
```

## What Gets Deleted

The following data will be removed (for non-admin users only):

- ❌ User profiles
- ❌ Authentication accounts
- ❌ Cars and car images
- ❌ Car pricing rules
- ❌ Rentals and rental checklists
- ❌ Maintenance records
- ❌ Verification documents
- ❌ Reminders

## What Gets Preserved

- ✅ Admin user profiles
- ✅ Admin authentication accounts
- ✅ Cars owned by admin users
- ✅ Rentals involving admin users (as owner or renter)
- ✅ All admin-related data

## Safety Features

1. **Transaction Wrapped**: SQL migration runs in a transaction (can rollback on error)
2. **Admin Check**: TypeScript script aborts if no admin users found
3. **Confirmation Required**: TypeScript script requires explicit "yes" confirmation
4. **Detailed Logging**: Both methods provide detailed output of what's being deleted
5. **Final Summary**: Shows remaining record counts after cleanup

## Troubleshooting

### "No admin users found"

Make sure you have at least one user with the 'admin' role in their roles array:

```sql
UPDATE profiles
SET roles = roles || '{admin}'::user_role[]
WHERE email = 'your-admin@email.com';
```

### Permission Errors

Make sure you're using the Service Role Key (not the anon key) for the TypeScript script.

### Foreign Key Errors

The deletion order is carefully designed to respect foreign key constraints. If you encounter errors, it may be due to custom tables or constraints not covered in this script.

## Need Help?

If you encounter any issues or need to customize the deletion logic, check:
- The SQL file: `supabase/migrations/024_delete_all_except_admin.sql`
- The TypeScript script: `scripts/reset-database.ts`

Both files contain detailed comments explaining each step.
