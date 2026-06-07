import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Singleton browser/server clients. The app works WITHOUT Supabase configured
// (falls back to bundled seed data) so it runs on first clone with zero setup.

let _anon: SupabaseClient | null | undefined;
let _admin: SupabaseClient | null | undefined;

export function hasSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Public client (RLS-restricted). Returns null if env not configured. */
export function getSupabase(): SupabaseClient | null {
  if (_anon !== undefined) return _anon;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  _anon = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return _anon;
}

/** Service-role client for ingestion/admin writes. Server-only. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (_admin !== undefined) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  _admin = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return _admin;
}
