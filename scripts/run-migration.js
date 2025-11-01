/**
 * Simple migration runner for Supabase
 * Runs the SQL migration files against the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filename) {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', filename);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${filename}`);
    return false;
  }

  console.log(`📝 Running migration: ${filename}`);

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ Error running migration:`, error);
      return false;
    }

    console.log(`✅ Migration completed: ${filename}`);
    return true;
  } catch (err) {
    console.error(`❌ Unexpected error:`, err);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting migration process...\n');

  // Run the status to is_active migration
  const success = await runMigration('020_replace_status_with_is_active.sql');

  if (!success) {
    console.log('\n⚠️  Migration failed. You may need to run it manually in the Supabase SQL Editor.');
    console.log('Location: supabase/migrations/020_replace_status_with_is_active.sql');
  } else {
    console.log('\n✅ All migrations completed successfully!');
  }

  process.exit(success ? 0 : 1);
}

main();
