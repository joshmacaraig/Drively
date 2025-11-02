/**
 * Script to check verification document URLs
 * Run with: npx tsx scripts/check-verification-urls.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
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

async function checkVerificationUrls() {
  console.log('🔍 Checking verification document URLs...\n');

  // Get verification document
  const { data: verification, error } = await supabase
    .from('verification_documents')
    .select('*')
    .eq('id', '2b30b828-0d1c-47ab-90b5-24da17136a04')
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📄 Verification Document:\n');
  console.log('ID:', verification.id);
  console.log('User ID:', verification.user_id);
  console.log('Status:', verification.status);
  console.log('\n📎 Document URLs:');
  console.log('─'.repeat(60));

  console.log('\nProof of ID URL:');
  console.log('  Type:', typeof verification.philsys_id_url);
  console.log('  Value:', JSON.stringify(verification.philsys_id_url, null, 2));

  console.log('\nProof of Address URL:');
  console.log('  Type:', typeof verification.proof_of_address_url);
  console.log('  Value:', JSON.stringify(verification.proof_of_address_url, null, 2));

  console.log('\nDriver\'s License URL:');
  console.log('  Type:', typeof verification.drivers_license_url);
  console.log('  Value:', JSON.stringify(verification.drivers_license_url, null, 2));

  console.log('\n' + '─'.repeat(60));

  // Also check the profiles table for comparison
  const { data: profile } = await supabase
    .from('profiles')
    .select('proof_of_id_urls, proof_of_address_urls, drivers_license_urls')
    .eq('id', verification.user_id)
    .single();

  if (profile) {
    console.log('\n📊 Original data in profiles table:');
    console.log('─'.repeat(60));
    console.log('\nProof of ID URLs (array):');
    console.log(JSON.stringify(profile.proof_of_id_urls, null, 2));
    console.log('\nProof of Address URLs (array):');
    console.log(JSON.stringify(profile.proof_of_address_urls, null, 2));
    console.log('\nDriver\'s License URLs (array):');
    console.log(JSON.stringify(profile.drivers_license_urls, null, 2));
  }
}

checkVerificationUrls()
  .then(() => {
    console.log('\n✨ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
