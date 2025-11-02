/**
 * Script to check verification data location
 * Run with: npx tsx scripts/check-verifications.ts
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

async function checkVerifications() {
  console.log('🔍 Checking verification data...\n');

  // Check profiles table for verification_status field
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, verification_status, proof_of_id_urls, proof_of_address_urls, drivers_license_urls')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
    return;
  }

  console.log(`📊 Total users in profiles table: ${profiles?.length || 0}`);

  // Count users by verification status in profiles
  const verified = profiles?.filter(p => p.verification_status === 'verified').length || 0;
  const pending = profiles?.filter(p => p.verification_status === 'pending').length || 0;
  const rejected = profiles?.filter(p => p.verification_status === 'rejected').length || 0;

  console.log('\n📋 Verification status in PROFILES table:');
  console.log(`   - Verified: ${verified}`);
  console.log(`   - Pending: ${pending}`);
  console.log(`   - Rejected: ${rejected}`);

  // Check for users with uploaded documents in profiles
  const withDocs = profiles?.filter(p =>
    (p.proof_of_id_urls && p.proof_of_id_urls.length > 0) ||
    (p.proof_of_address_urls && p.proof_of_address_urls.length > 0) ||
    (p.drivers_license_urls && p.drivers_license_urls.length > 0)
  ) || [];

  console.log(`\n📄 Users with documents in profiles table: ${withDocs.length}`);
  if (withDocs.length > 0) {
    console.log('\nUsers with documents:');
    withDocs.forEach(p => {
      console.log(`   - ${p.full_name} (${p.verification_status})`);
      if (p.proof_of_id_urls?.length) console.log(`     • Proof of ID: ${p.proof_of_id_urls.length} file(s)`);
      if (p.proof_of_address_urls?.length) console.log(`     • Proof of Address: ${p.proof_of_address_urls.length} file(s)`);
      if (p.drivers_license_urls?.length) console.log(`     • Driver's License: ${p.drivers_license_urls.length} file(s)`);
    });
  }

  // Check verification_documents table
  const { data: verificationDocs, error: docsError } = await supabase
    .from('verification_documents')
    .select('*');

  if (docsError) {
    console.error('❌ Error fetching verification_documents:', docsError);
    return;
  }

  console.log(`\n📋 Verification documents in VERIFICATION_DOCUMENTS table: ${verificationDocs?.length || 0}`);

  if (verificationDocs && verificationDocs.length > 0) {
    const docsPending = verificationDocs.filter(v => v.status === 'pending').length;
    const docsApproved = verificationDocs.filter(v => v.status === 'approved').length;
    const docsRejected = verificationDocs.filter(v => v.status === 'rejected').length;

    console.log('   - Pending: ' + docsPending);
    console.log('   - Approved: ' + docsApproved);
    console.log('   - Rejected: ' + docsRejected);
  }

  // Summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 SUMMARY:');
  console.log('━'.repeat(60));

  if (withDocs.length > 0 && (!verificationDocs || verificationDocs.length === 0)) {
    console.log('⚠️  You have verification data in the OLD system (profiles table)');
    console.log('   but NO data in the NEW system (verification_documents table).');
    console.log('\n💡 Recommendation:');
    console.log('   Your app is checking verification_documents table, but data is');
    console.log('   stored in profiles table. You have two options:');
    console.log('   1. Update your app to read from profiles.verification_status');
    console.log('   2. Create migration script to move data to verification_documents');
  } else if (withDocs.length === 0 && (!verificationDocs || verificationDocs.length === 0)) {
    console.log('ℹ️  No verification documents found in either system.');
    console.log('   Users need to submit verification documents from their profile page.');
  } else if (verificationDocs && verificationDocs.length > 0) {
    console.log('✅ Verification data found in verification_documents table.');
    console.log('   Admin pages should display this data correctly.');
  }

  console.log('━'.repeat(60));
}

checkVerifications()
  .then(() => {
    console.log('\n✨ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
