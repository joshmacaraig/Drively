/**
 * Script to migrate verification data from profiles to verification_documents table
 * Run with: npx tsx scripts/migrate-verification-data.ts
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function migrateVerificationData() {
  console.log('🔄 Starting migration of verification data...\n');

  // Get all users with verification documents in profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, verification_status, proof_of_id_urls, proof_of_address_urls, drivers_license_urls, created_at')
    .or('proof_of_id_urls.not.is.null,proof_of_address_urls.not.is.null,drivers_license_urls.not.is.null');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('ℹ️  No profiles with verification documents found.');
    return;
  }

  console.log(`📊 Found ${profiles.length} user(s) with verification documents\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const profile of profiles) {
    const hasProofOfId = profile.proof_of_id_urls && profile.proof_of_id_urls.length > 0;
    const hasProofOfAddress = profile.proof_of_address_urls && profile.proof_of_address_urls.length > 0;
    const hasDriversLicense = profile.drivers_license_urls && profile.drivers_license_urls.length > 0;

    // Skip if no documents
    if (!hasProofOfId && !hasProofOfAddress && !hasDriversLicense) {
      console.log(`⏭️  Skipping ${profile.full_name} - no documents`);
      skipped++;
      continue;
    }

    console.log(`📝 Migrating ${profile.full_name}...`);

    // Check if already migrated
    const { data: existing } = await supabase
      .from('verification_documents')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (existing) {
      console.log(`   ⚠️  Already migrated, skipping`);
      skipped++;
      continue;
    }

    // Map old status to new status
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'verified': 'approved',
      'rejected': 'rejected'
    };

    const newStatus = statusMap[profile.verification_status || 'pending'] || 'pending';

    // Create verification document
    const { data: verificationDoc, error: insertError } = await supabase
      .from('verification_documents')
      .insert({
        user_id: profile.id,
        philsys_id_url: hasProofOfId ? profile.proof_of_id_urls[0] : null,
        proof_of_address_url: hasProofOfAddress ? profile.proof_of_address_urls[0] : null,
        drivers_license_url: hasDriversLicense ? profile.drivers_license_urls[0] : null,
        status: newStatus,
        submitted_at: profile.created_at,
        created_at: profile.created_at,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`   ❌ Error migrating ${profile.full_name}:`, insertError.message);
      errors++;
      continue;
    }

    console.log(`   ✅ Migrated successfully (ID: ${verificationDoc.id})`);
    console.log(`      - Proof of ID: ${hasProofOfId ? '✓' : '✗'}`);
    console.log(`      - Proof of Address: ${hasProofOfAddress ? '✓' : '✗'}`);
    console.log(`      - Driver's License: ${hasDriversLicense ? '✓' : '✗'}`);
    console.log(`      - Status: ${newStatus}`);
    migrated++;
  }

  console.log('\n' + '━'.repeat(60));
  console.log('📊 MIGRATION SUMMARY:');
  console.log('━'.repeat(60));
  console.log(`✅ Successfully migrated: ${migrated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('━'.repeat(60));

  if (migrated > 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('   You can now view verification documents at:');
    console.log('   http://localhost:3000/admin/verifications');
  }
}

migrateVerificationData()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
