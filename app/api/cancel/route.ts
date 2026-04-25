// app/api/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { success: false, error: "bookingId requerido" },
        { status: 400 },
      );
    }
    // Dynamic import keeps env vars lazy (same pattern as /api/book)
    const { cancelBooking } = await import("@/lib/db");
    const booking = await cancelBooking(bookingId);
    return NextResponse.json({ success: true, booking });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al cancelar";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const phone = new URL(req.url).searchParams.get("phone") ?? undefined;
  const { getActiveBookings } = await import("@/lib/db");
  const bookings = await getActiveBookings(phone);
  return NextResponse.json({ bookings });
}
