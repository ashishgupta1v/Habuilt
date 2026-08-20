import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://eefrpxxcztapatyqokpv.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZnJweHhjenRhcGF0eXFva3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjQ5MDAsImV4cCI6MjA4OTA0MDkwMH0.1pct7C4PK0q9MicvOOM0CW99cc6pJLsV4jKVMoy9b5c';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches the user monthly state document.
 * @param {string} userId
 * @param {string} monthKey (e.g. "2024-11")
 */
export const loadUserMonthlyState = async (userId, monthKey) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_monthly_states')
    .select('state_data')
    .eq('user_id', userId)
    .eq('month_key', monthKey)
    .maybeSingle();

  if (error) {
    console.error('Error fetching state:', error);
    return null;
  }
  return data?.state_data || null;
};

/**
 * Upserts the user monthly state document.
 * @param {string} userId
 * @param {string} monthKey
 * @param {object} stateData
 */
export const saveUserMonthlyState = async (userId, monthKey, stateData) => {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('user_monthly_states')
    .upsert({
      user_id: userId,
      month_key: monthKey,
      state_data: stateData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,month_key'
    });

  if (error) {
    console.error('Error saving state:', error);
    return false;
  }
  
  return true;
};

/**
 * Fetches all monthly state documents for a user.
 * @param {string} userId
 */
export const loadAllUserMonthlyStates = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_monthly_states')
    .select('month_key, state_data')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching all states:', error);
    return [];
  }
  return data || [];
};
