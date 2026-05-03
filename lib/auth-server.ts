// lib/auth-server.ts
// Server-side auth helpers — safe to use in API routes and Server Components.
// All imports are lazy so env vars are only read at runtime.

import type { Profile, UserRole } from "@/types";

/** Get profile + role for a given user ID. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { getServerClient } = await import("@/lib/supabase");
  const sb = getServerClient();

  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

/** Upsert a profile (called after login to ensure it exists). */
export async function upsertProfile(
  userId: string,
  email: string,
): Promise<Profile> {
  const { getServerClient } = await import("@/lib/supabase");
  const sb = getServerClient();

  const { data, error } = await sb
    .from("profiles")
    .upsert(
      { id: userId, email, role: "USER" },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select()
    .single();

  if (error || !data) throw new Error("Could not upsert profile");
  return data as Profile;
}

/** Get the current session from a request's Authorization header or cookie. */
export async function getSessionUser(
  accessToken: string,
): Promise<{ id: string; email: string } | null> {
  const { getServerClient } = await import("@/lib/supabase");
  const sb = getServerClient();

  const { data, error } = await sb.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
}

/** Assert role — throws if user is not ADMIN. */
export function assertAdmin(role: UserRole) {
  if (role !== "ADMIN") throw new Error("Forbidden: admin only");
}
