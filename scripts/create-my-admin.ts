/**
 * Script to create admin user account
 * Run with: npx tsx scripts/create-my-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded environment variables from .env.local');
} else {
  console.error('❌ .env.local file not found');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
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
  const password = 'joshua31M';
  const fullName = 'Josh Baje (Admin)';

  console.log('🚀 Creating admin user...');
  console.log('📧 Email:', email);

  // Step 1: Create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      full_name: fullName,
    },
  });

  if (authError) {
    // Check if user already exists
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      console.log('⚠️  User already exists, fetching user data...');

      // Get the existing user
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error('❌ Error fetching users:', listError);
        return;
      }

      const existingUser = users.users.find(u => u.email === email);

      if (!existingUser) {
        console.error('❌ Could not find existing user');
        return;
      }

      console.log('✅ Found existing user with ID:', existingUser.id);

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        console.error('⚠️  Could not update password:', updateError.message);
      } else {
        console.log('✅ Password updated successfully');
      }

      // Update the profile to admin
      await updateProfileToAdmin(existingUser.id, fullName);
      return;
    }

    console.error('❌ Error creating auth user:', authError);
    return;
  }

  console.log('✅ Auth user created successfully:', authData.user.id);

  // Step 2: Update the profile to make them admin
  await updateProfileToAdmin(authData.user.id, fullName);
}

async function updateProfileToAdmin(userId: string, fullName: string) {
  console.log('🔧 Updating profile to admin role...');

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
    console.error('❌ Error updating profile:', error);
    return;
  }

  console.log('✅ Profile updated successfully');
  console.log('\n🎉 Admin account is ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:    bajejosh+admin@gmail.com');
  console.log('🔑 Password: joshua31M');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📍 Next steps:');
  console.log('   1. Go to http://localhost:3000/auth/login');
  console.log('   2. Login with the credentials above');
  console.log('   3. Access admin dashboard at /admin/dashboard');
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
