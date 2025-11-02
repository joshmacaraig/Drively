/**
 * Script to check which bucket has the verification files
 * Run with: npx tsx scripts/check-storage-buckets.ts
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

const filePaths = [
  '06450b6e-bf72-4902-9c0c-29c3b6165b07/proof_of_address_urls_1762030030926_o4sldut.jpg',
  '06450b6e-bf72-4902-9c0c-29c3b6165b07/drivers_license_urls_1762030040483_n7ripgj.jpg'
];

async function checkBuckets() {
  console.log('🔍 Checking which bucket contains the verification files...\n');

  const buckets = ['drively-storage', 'verification-documents'];

  for (const bucketName of buckets) {
    console.log(`\n📦 Checking bucket: ${bucketName}`);
    console.log('─'.repeat(60));

    for (const filePath of filePaths) {
      try {
        // Try to get the file info
        const { data, error } = await supabase
          .storage
          .from(bucketName)
          .list(filePath.split('/')[0]);

        if (error) {
          console.log(`  ❌ Error accessing bucket: ${error.message}`);
          break;
        }

        if (data && data.length > 0) {
          const fileName = filePath.split('/')[1];
          const fileExists = data.some(file => file.name === fileName);

          if (fileExists) {
            console.log(`  ✅ Found: ${fileName}`);

            // Try to get public URL
            const { data: urlData } = supabase
              .storage
              .from(bucketName)
              .getPublicUrl(filePath);

            console.log(`     URL: ${urlData.publicUrl}`);
          }
        }
      } catch (err: any) {
        console.log(`  ❌ Error: ${err.message}`);
      }
    }
  }

  // Also list all buckets
  console.log('\n\n📋 All available buckets:');
  console.log('─'.repeat(60));

  const { data: bucketsList, error: bucketsError } = await supabase
    .storage
    .listBuckets();

  if (bucketsList) {
    bucketsList.forEach(bucket => {
      console.log(`  • ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
    });
  }

  console.log('\n\n💡 Recommendation:');
  console.log('─'.repeat(60));
  console.log('Moving forward, all verification documents will be uploaded to:');
  console.log('  📦 verification-documents bucket');
  console.log('\nMake sure this bucket is PUBLIC so images can be viewed!');
}

checkBuckets()
  .then(() => {
    console.log('\n✨ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
