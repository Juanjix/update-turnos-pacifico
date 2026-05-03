// lib/auth-client.ts
// Browser-safe auth helpers — singleton client so session state is shared
// across signIn / getSession / signOut calls within the same page lifecycle.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await getClient().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  await getClient().auth.signOut();
}

export async function getSession() {
  const { data } = await getClient().auth.getSession();
  return data.session;
}
