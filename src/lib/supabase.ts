import { createClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client.
 *
 * Both values are public by design: the anon key is meant to ship to the
 * browser and is constrained by row-level security on the database side.
 * Secrets never live here.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False when the app has no credentials — we then fall back to demo data. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
