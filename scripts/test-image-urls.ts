/**
 * Test script to verify image URLs are constructed correctly
 */

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const STORAGE_BUCKET = 'drively-storage';

const proofOfAddressPath = '06450b6e-bf72-4902-9c0c-29c3b6165b07/proof_of_address_urls_1762030030926_o4sldut.jpg';
const driversLicensePath = '06450b6e-bf72-4902-9c0c-29c3b6165b07/drivers_license_urls_1762030040483_n7ripgj.jpg';

const proofOfAddressUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${proofOfAddressPath}`;
const driversLicenseUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${driversLicensePath}`;

console.log('📸 Expected Image URLs:\n');
console.log('Proof of Address:');
console.log(proofOfAddressUrl);
console.log('\nDriver\'s License:');
console.log(driversLicenseUrl);
console.log('\n✅ These URLs should be accessible in your browser if the storage bucket is public.');
console.log('\n💡 Test by copying a URL and pasting it into your browser address bar.');
