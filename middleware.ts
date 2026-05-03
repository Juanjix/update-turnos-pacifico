// middleware.ts  (project root — alongside package.json)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PUBLIC_PATHS = [
  "/login",
  "/api/",
  "/_next/",
  "/favicon",
  "/logo",
  "/icon",
  "/apple",
  "/og",
  "/site.webmanifest",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // Read session token from cookie
  const tokenCookie =
    req.cookies.get("sb-access-token")?.value ??
    // Supabase stores it under a project-specific key like sb-<ref>-auth-token
    [...req.cookies.getAll()].find((c) => c.name.includes("-auth-token"))
      ?.value;

  if (!tokenCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Validate token + get role
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const {
      data: { user },
      error,
    } = await sb.auth.getUser(tokenCookie);
    if (error || !user)
      return NextResponse.redirect(new URL("/login", req.url));

    // Fetch role (service role key needed — use server-side header trick)
    const profileRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      },
    );
    const profiles = await profileRes.json();
    const role = profiles?.[0]?.role ?? "USER";

    // /admin/* → ADMIN only
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/reservar", req.url));
    }

    // Inject role as header so server components can read it
    const res = NextResponse.next();
    res.headers.set("x-user-id", user.id);
    res.headers.set("x-user-role", role);
    return res;
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
