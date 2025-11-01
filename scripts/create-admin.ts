/**
 * Script to create an admin user account
 * Run with: npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  const email = 'bajejosh+admin@gmail.com';
  const password = '1';
  const fullName = 'Admin User';

  console.log('Creating admin user...');

  // Step 1: Create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
  });

  if (authError) {
    console.error('Error creating auth user:', authError);

    // Check if user already exists
    if (authError.message.includes('already registered')) {
      console.log('User already exists, fetching user data...');

      // Get the existing user
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error('Error fetching users:', listError);
        return;
      }

      const existingUser = users.users.find(u => u.email === email);

      if (!existingUser) {
        console.error('Could not find existing user');
        return;
      }

      console.log('Found existing user with ID:', existingUser.id);

      // Update the profile to admin
      await updateProfileToAdmin(existingUser.id, fullName);
      return;
    }

    return;
  }

  console.log('Auth user created successfully:', authData.user.id);

  // Step 2: Update the profile to make them admin
  await updateProfileToAdmin(authData.user.id, fullName);
}

async function updateProfileToAdmin(userId: string, fullName: string) {
  console.log('Updating profile to admin role...');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      active_role: 'admin',
      roles: ['admin', 'renter', 'car_owner'],
      full_name: fullName,
    })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('Error updating profile:', error);
    return;
  }

  console.log('Profile updated successfully:', data);
  console.log('\n✅ Admin user created successfully!');
  console.log('Email: bajejosh+admin@gmail.com');
  console.log('Password: 1');
  console.log('\nYou can now login at /auth/login and access the admin dashboard at /admin/dashboard');
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('\nScript completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
