import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eefrpxxcztapatyqokpv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZnJweHhjenRhcGF0eXFva3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjQ5MDAsImV4cCI6MjA4OTA0MDkwMH0.1pct7C4PK0q9MicvOOM0CW99cc6pJLsV4jKVMoy9b5c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = [
  'habit_check_ins',
  'user_settings',
  'user_protocols',
  'partner_connections',
  'user_biomarkers',
];

async function verify() {
  console.log('=== VERIFYING SUPABASE DATABASE SCHEMA ===');
  let allOk = true;

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table [${table}]: FAILED (${error.code || ''} - ${error.message})`);
      allOk = false;
    } else {
      console.log(`✅ Table [${table}]: ACTIVE (Accessible via REST API, ${data.length} sample row(s) inspected)`);
    }
  }

  console.log('==========================================');
  if (allOk) {
    console.log('🎉 ALL TABLES VERIFIED AND OPERATIONAL!');
    process.exit(0);
  } else {
    console.log('⚠️ Some tables are missing. Please execute Section 6 in Supabase SQL Editor.');
    process.exit(1);
  }
}

verify();
