// app/api/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { computeAvailability, validateDate } from "@/lib/schedule";
import { Court, Booking, AvailabilityResponse } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  // --- Validation ---
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

  // Import inside the handler so env vars are only read at runtime, not build time
  const { supabase } = await import("@/lib/supabase");

  // --- Fetch all courts ---
  const { data: courts, error: courtsError } = await supabase
    .from("courts")
    .select("*")
    .order("name");

  if (courtsError) {
    console.error("[availability] courts error:", courtsError);
    return NextResponse.json(
      { error: "Error al obtener canchas" },
      { status: 500 },
    );
  }

  // --- Fetch confirmed bookings for the date ---
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, court_id, time_start, time_end, client_name")
    .eq("date", date)
    .eq("status", "confirmed");

  if (bookingsError) {
    console.error("[availability] bookings error:", bookingsError);
    return NextResponse.json(
      { error: "Error al obtener reservas" },
      { status: 500 },
    );
  }

  // --- Build response ---
  const response: AvailabilityResponse = {
    date,
    courts: (courts as Court[]).map((court) => {
      const courtBookings = (
        bookings as Pick<
          Booking,
          "id" | "court_id" | "time_start" | "time_end" | "client_name"
        >[]
      ).filter((b) => b.court_id === court.id);
      return {
        court,
        slots: computeAvailability(courtBookings),
      };
    }),
  };

  return NextResponse.json(response);
}
