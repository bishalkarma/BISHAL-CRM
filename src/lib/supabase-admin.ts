/**
 * Server-side Supabase client with the service_role key.
 *
 * Used by API routes to perform admin operations (create users, reset
 * passwords) that the browser client is not allowed to do.
 *
 * NEVER import this from a "use client" component — it contains secrets.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseAdminConfigured = Boolean(url && serviceKey);

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(url!, serviceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
