// lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton — client is created on first use, not at import time.
// This avoids build-time crashes when env vars are only available at runtime (Vercel, etc.)
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "[Supabase] Missing environment variables.\n" +
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "to your Vercel project settings (or .env.local for local dev).",
    );
  }

  _client = createClient(url, key);
  return _client;
}

// Convenience re-export for files that prefer the old `supabase.from(...)` style.
// Still lazy — the getter is called on first property access.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as never)[prop];
  },
});
