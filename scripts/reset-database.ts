/**
 * Reset Database Script
 * Deletes all records from the database except admin users
 *
 * Usage: npx tsx scripts/reset-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmReset(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  WARNING: This will delete ALL records except admin users!\nAre you sure you want to continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function getAdminUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, roles')
    .contains('roles', ['admin']);

  if (error) {
    throw new Error(`Failed to fetch admin users: ${error.message}`);
  }

  return data || [];
}

async function resetDatabase() {
  console.log('\n🔍 Checking for admin users...');

  const adminUsers = await getAdminUsers();

  if (adminUsers.length === 0) {
    console.error('❌ No admin users found! Aborting to prevent complete data loss.');
    process.exit(1);
  }

  console.log(`\n✅ Found ${adminUsers.length} admin user(s):`);
  adminUsers.forEach(admin => {
    console.log(`   - ${admin.full_name} (${admin.id})`);
  });

  const confirmed = await confirmReset();

  if (!confirmed) {
    console.log('\n❌ Reset cancelled by user.');
    process.exit(0);
  }

  console.log('\n🗑️  Starting database cleanup...\n');

  const adminIds = adminUsers.map(u => u.id);

  try {
    // Step 1: Delete reminders
    console.log('1. Deleting reminders...');
    const { error: remindersError } = await supabase
      .from('reminders')
      .delete()
      .not('user_id', 'in', `(${adminIds.map(id => `"${id}"`).join(',')})`);

    if (remindersError) throw remindersError;
    console.log('   ✓ Reminders deleted');

    // Step 2: Delete rental checklists
    console.log('2. Deleting rental checklists...');
    const { data: nonAdminRentals } = await supabase
      .from('rentals')
      .select('id')
      .not('renter_id', 'in', `(${adminIds.map(id => `"${id}"`).join(',')})`)
      .not('owner_id', 'in', `(${adminIds.map(id => `"${id}"`).join(',')})`);

    if (nonAdminRentals && nonAdminRentals.length > 0) {
      const rentalIds = nonAdminRentals.map(r => r.id);
      const { error: checklistsError } = await supabase
        .from('rental_checklists')
        .delete()
        .in('rental_id', rentalIds);

      if (checklistsError) throw checklistsError;
    }
    console.log('   ✓ Rental checklists deleted');

    // Step 3: Delete rentals
    console.log('3. Deleting rentals...');
    const { error: rentalsError } = await supabase
      .from('rentals')
      .delete()
      .not('renter_id', 'in', `(${adminIds.map(id => `"${id}"`).join(',')})`)
      .not('owner_id', 'in', `(${adminIds.map(id => `"${id}"`).join(',')})`);

    if (rentalsError) throw rentalsError;
    console.log('   ✓ Rentals deleted');

    // Step 4: Get non-admin car IDs
    const { data: nonAdminCars } = await supabase
      .from('cars')
      .select('id')
      .not('owner_id', 'in', `(${adminIds.map(id => `"${id}"`).join(',')})`);

    const carIds = nonAdminCars?.map(c => c.id) || [];

    if (carIds.length > 0) {
      // Delete maintenance records
      console.log('4. Deleting maintenance records...');
      const { error: maintenanceError } = await supabase
        .from('maintenance_records')
        .delete()
        .in('car_id', carIds);

      if (maintenanceError) throw maintenanceError;
      console.log('   ✓ Maintenance records deleted');

      // Delete car pricing rules
      console.log('5. Deleting car pricing rules...');
      const { error: pricingError } = await supabase
        .from('car_pricing_rules')
        .delete()
        .in('car_id', carIds);

      if (pricingError) throw pricingError;
      console.log('   ✓ Car pricing rules deleted');

      // Delete car images
      console.log('6. Deleting car images...');
      const { error: imagesError } = await supabase
        .from('car_images')
        .delete()
        .in('car_id', carIds);

      if (imagesError) throw imagesError;
      console.log('   ✓ Car images deleted');
    }

    // Step 5: Delete cars
    console.log('7. Deleting cars...');
    const { error: carsError } = await supabase
      .from('cars')
      .delete()
      .not('owner_id', 'in', `(${adminIds.map(id => `"${id}"`).join(',')})`);

    if (carsError) throw carsError;
    console.log('   ✓ Cars deleted');

    // Step 6: Delete verification documents
    console.log('8. Deleting verification documents...');
    const { error: verificationsError } = await supabase
      .from('verification_documents')
      .delete()
      .not('user_id', 'in', `(${adminIds.map(id => `"${id}"`).join(',')})`);

    if (verificationsError) throw verificationsError;
    console.log('   ✓ Verification documents deleted');

    // Step 7: Delete non-admin profiles (this will cascade to auth.users)
    console.log('9. Deleting non-admin profiles...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .not('id', 'in', `(${adminIds.map(id => `"${id}"`).join(',')})`);

    if (profilesError) throw profilesError;
    console.log('   ✓ Non-admin profiles deleted');

    // Get final counts
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: carCount } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });

    const { count: rentalCount } = await supabase
      .from('rentals')
      .select('*', { count: 'exact', head: true });

    console.log('\n====================================');
    console.log('✅ Database reset complete!');
    console.log('====================================');
    console.log('Remaining records:');
    console.log(`  - Profiles: ${profileCount || 0}`);
    console.log(`  - Cars: ${carCount || 0}`);
    console.log(`  - Rentals: ${rentalCount || 0}`);
    console.log('====================================\n');

  } catch (error) {
    console.error('\n❌ Error during database reset:', error);
    throw error;
  }
}

// Run the script
resetDatabase()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
