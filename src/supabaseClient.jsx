import { createClient } from "@supabase/supabase-js";

// ==============================================================================
// ELARIS SOLUTIONS - PRODUCTION & VERCEL ROBUST SUPABASE CLIENT
// ==============================================================================
// On Vercel and production builds, environment variables are embedded at build time.
// If Vercel env vars are not set, named differently (e.g. VITE_SUPABASE_ANON_KEY),
// or missing, falling back to verified defaults prevents an immediate top-level crash
// (Error: supabaseUrl is required / supabaseKey is required) that causes a blank white screen.

const DEFAULT_SUPABASE_URL = "https://njkqzwknqswgrhhsvrwm.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_hE0kCeRT21ZCQbAzBiqmHA_ucTKyblg";

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL
)?.trim();

const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_KEY
)?.trim();

let clientInstance = null;

try {
  clientInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        'x-application-name': 'elaris-hrms',
      },
    },
  });
} catch (err) {
  console.error('Critical Supabase client initialization error:', err);
  // Resilient fallback client to prevent catastrophic bundle crash
  clientInstance = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
}

export const supabase = clientInstance;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
