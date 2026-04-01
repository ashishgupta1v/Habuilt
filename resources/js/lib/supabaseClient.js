import { createClient } from '@supabase/supabase-js';

let client = null;

export const hasSupabaseEnv = () => Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const getSupabaseClient = () => {
  if (client !== null) {
    return client;
  }

  if (!hasSupabaseEnv()) {
    client = false;
    return null;
  }

  client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
};
