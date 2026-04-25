// app/api/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateDate } from "@/lib/schedule";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: 'El parámetro "date" es requerido' },
      { status: 400 },
    );
  }
  const dateError = validateDate(date);
  if (dateError) {
    return NextResponse.json({ error: dateError }, { status: 400 });
  }

  try {
    const { getAvailability } = await import("@/lib/db");
    const response = await getAvailability(date);
    return NextResponse.json(response);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[availability] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
