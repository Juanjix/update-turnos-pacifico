// app/api/admin/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Role check via header set by middleware
  const role = req.headers.get("x-user-role");
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { getServerClient } = await import("@/lib/supabase");
    const sb = getServerClient();

    const { data, error } = await sb
      .from("bookings")
      .select("*")
      .order("date", { ascending: false })
      .order("time_start", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ bookings: data ?? [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
