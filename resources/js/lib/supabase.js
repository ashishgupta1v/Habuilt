import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase URL or Anon Key is missing from environment variables.");
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => {},
        signInWithPassword: async () => ({ error: new Error('Supabase is not configured.') }),
        signUp: async () => ({ error: new Error('Supabase is not configured.') }),
      }
    };

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
