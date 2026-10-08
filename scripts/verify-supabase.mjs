import { createClient } from '@supabase/supabase-js';

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if ((!supabaseUrl || !supabaseAnonKey) && existsSync(resolve(process.cwd(), '.env'))) {
  const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    const key = k?.trim();
    const val = v.join('=').trim().replace(/^["']|["']$/g, '');
    if (key === 'VITE_SUPABASE_URL' && !supabaseUrl) supabaseUrl = val;
    if (key === 'VITE_SUPABASE_ANON_KEY' && !supabaseAnonKey) supabaseAnonKey = val;
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment or .env');
  process.exit(1);
}

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
