import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[v0] Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('[v0] Supabase Key:', supabaseAnonKey ? '✓ Set' : '✗ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[v0] Missing Supabase environment variables. Check .env.local or project settings.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const initializeSupabase = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[v0] Auth session error:', error.message);
    }
    return session;
  } catch (error) {
    console.error('[v0] Supabase initialization error:', error);
    return null;
  }
};
