// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const role = req.headers.get("x-user-role");
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { getServerClient } = await import("@/lib/supabase");
    const sb = getServerClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await sb.from("bookings").select("status, date");

    if (error) throw new Error(error.message);

    const rows = data ?? [];
    return NextResponse.json({
      total: rows.length,
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
      today: rows.filter((r) => r.date === today && r.status === "confirmed")
        .length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
