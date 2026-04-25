// lib/supabase.ts
// Two lazy singletons:
//   - anonClient   → for client-side / public queries (uses NEXT_PUBLIC_SUPABASE_ANON_KEY)
//   - serverClient → for server-side / privileged queries (uses SUPABASE_SERVICE_ROLE_KEY)
//
// Always use serverClient in API routes (bypasses RLS, required for writes).
// Use anonClient only if you add auth and want RLS enforcement.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`[Supabase] Missing env var: ${key}`);
  return val;
}

// ── Server client (service role — bypasses RLS) ───────────────────────────────
let _server: SupabaseClient | null = null;

export function getServerClient(): SupabaseClient {
  if (_server) return _server;
  _server = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }, // never persist on server
  );
  return _server;
}

// ── Anon client (respects RLS — safe for public reads) ────────────────────────
let _anon: SupabaseClient | null = null;

export function getAnonClient(): SupabaseClient {
  if (_anon) return _anon;
  _anon = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
  return _anon;
}

// ── Default export (server client via Proxy — lazy, safe for API routes) ──────
// Kept for backward compat with existing imports: `import { supabase } from '@/lib/supabase'`
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getServerClient() as never)[prop];
  },
});
