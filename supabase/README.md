# Drively Database Setup

## Quick Setup Instructions

### 1. Run the Database Migrations

**IMPORTANT: Run these migrations in order**

#### Step 1: Clean Reset Migration
1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
2. Click **New Query**
3. Copy and paste the contents of `migrations/002_clean_reset.sql`
4. Click **Run** to execute the migration
5. Wait for "Success. No rows returned"

#### Step 2: Profile Trigger Migration (FIXED VERSION)
1. In the same SQL Editor, click **New Query** again
2. Copy and paste the contents of `migrations/004_fix_profile_trigger.sql` ⚠️ **Use this one, not 003**
3. Click **Run** to execute the migration
4. This creates a robust trigger that automatically creates user profiles on signup

**What these migrations do:**
- `002_clean_reset.sql` - Drops all existing tables and recreates the database schema
- `004_fix_profile_trigger.sql` - Creates a robust trigger with error handling for automatic profile creation

**Troubleshooting:**
If you get a 500 error when signing up, run `debug_check.sql` in the SQL Editor to diagnose the issue.

### 2. Configure Authentication

1. In your Supabase dashboard, go to **Authentication** > **URL Configuration**
2. Add the following redirect URLs:
   - Site URL: `http://localhost:3000`
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000`

### 3. Storage Setup (Optional - for later)

If you want to enable file uploads for car images and verification documents:

1. Go to **Storage** in the Supabase dashboard
2. Create a new bucket called `drively-storage`
3. Set it to **Public** if you want car images to be publicly accessible
4. Update the bucket policies as needed

## Database Schema Overview

### Tables Created:

1. **profiles** - User profiles with roles (admin, renter, car_owner)
2. **verification_documents** - KYC documents for renters and owners
3. **cars** - Vehicle listings
4. **car_images** - Photos of vehicles
5. **rentals** - Rental bookings and transactions
6. **checklist_templates** - Reusable pickup/return checklists
7. **rental_checklists** - Completed checklists for each rental
8. **maintenance_records** - Vehicle maintenance history
9. **reminders** - Scheduled reminders for users

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:
- Users can only view and edit their own data
- Car owners can manage their own vehicles
- Renters and owners can both access rental data for their bookings
- Public can view available cars

## Testing the Setup

After running the migration, test your setup:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signup`

3. Create a test account:
   - Choose "Rent a Car" or "List My Car"
   - Fill in the form
   - Submit

4. You should be redirected to the appropriate dashboard based on your role

5. Check the Supabase dashboard > **Authentication** > **Users** to verify the user was created

6. Check **Table Editor** > **profiles** to see the profile was created

## Troubleshooting

### Error: "relation 'profiles' does not exist"
- Make sure you ran the migration SQL in the SQL Editor
- Verify the tables were created in **Table Editor**

### Error: 500 Internal Server Error during signup
This usually means the database trigger failed. To fix:

1. **Run the fixed trigger migration:**
   - Go to SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
   - Copy/paste `migrations/004_fix_profile_trigger.sql`
   - Click **Run**

2. **Disable email confirmation (for testing):**
   - Go to **Authentication** > **Providers** > **Email**
   - Toggle **OFF** "Confirm email"

3. **Check trigger status:**
   - Run the queries in `debug_check.sql` to verify everything is set up correctly

4. **Delete test users:**
   - Go to **Authentication** > **Users**
   - Delete any partially created test users
   - Try signing up again

### Error: "new row violates row-level security policy"
- Check that RLS policies are properly set up
- Verify the user is authenticated
- The fixed trigger (004) includes proper RLS policies

### Cannot sign in after signup
- Check **Authentication** > **Email Templates** to ensure email verification is configured
- For development, disable email confirmation in **Authentication** > **Providers** > **Email** > Toggle off "Confirm email"

## Next Steps

1. Set up storage buckets for file uploads
2. Configure email templates for password reset and verification
3. Add custom email provider (SendGrid, etc.) for production
4. Set up database backups
5. Configure additional RLS policies as needed
