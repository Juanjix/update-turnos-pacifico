// lib/db.ts
// Supabase implementation — all imports are lazy (inside functions)
// so env vars are only read at runtime, never at build time.

import {
  Booking,
  Court,
  CourtAvailability,
  AvailabilityResponse,
  GameType,
  Player,
  BookingStatus,
} from "@/types";
import {
  computeAvailability,
  getTodayISO,
  getCurrentTimeHHMM,
  timesOverlap,
} from "@/lib/schedule";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateBookingParams {
  courtId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  name: string;
  phone: string;
  gameType: GameType;
  players: Player[];
  isMember: boolean;
}

interface BookingRow {
  id: string;
  court_id: string;
  date: string;
  time_start: string;
  time_end: string;
  players: Player[];
  game_type: GameType;
  is_member: boolean;
  phone: string;
  status: BookingStatus;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FALLBACK_COURTS: Court[] = [
  { id: "1", name: "Cancha 1", type: "outdoor" },
  { id: "2", name: "Cancha 2", type: "outdoor" },
  { id: "3", name: "Cancha 3", type: "outdoor" },
  { id: "4", name: "Cancha 4", type: "outdoor" },
  { id: "5", name: "Cancha 5 (Cubierta)", type: "indoor" },
  { id: "6", name: "Cancha 6 (Cubierta)", type: "indoor" },
];

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    court_id: row.court_id,
    date: row.date,
    time_start: row.time_start,
    time_end: row.time_end,
    client_name: row.players?.[0]?.name ?? "",
    client_phone: row.players?.[0]?.phone ?? "",
    game_type: row.game_type,
    players: row.players ?? [],
    is_member: row.is_member,
    phone: row.phone,
    status: row.status,
    created_at: row.created_at,
  };
}

/** Lazy Supabase client — reads env vars only when called, never at import time */
async function sb() {
  const { getServerClient } = await import("@/lib/supabase");
  return getServerClient();
}

// ─── getAvailability ──────────────────────────────────────────────────────────

export async function getAvailability(
  date: string,
): Promise<AvailabilityResponse> {
  const client = await sb();

  // Fetch courts + active bookings for the date in parallel
  const [courtsResult, bookingsResult] = await Promise.all([
    client.from("courts").select("*").order("name"),
    client
      .from("bookings")
      .select("id, court_id, time_start, time_end, players")
      .eq("date", date)
      .eq("status", "confirmed"),
  ]);

  if (courtsResult.error) {
    console.warn(
      "[db] courts fetch failed, using fallback:",
      courtsResult.error.message,
    );
  }

  const courts = (
    courtsResult.data?.length ? courtsResult.data : FALLBACK_COURTS
  ) as Court[];

  if (bookingsResult.error) {
    console.error("[db] bookings fetch error:", bookingsResult.error.message);
    throw new Error("Error al obtener disponibilidad");
  }

  const rows = bookingsResult.data ?? [];

  const result: CourtAvailability[] = courts.map((court) => {
    const courtBookings = rows
      .filter((b) => b.court_id === court.id)
      .map((b) => ({
        id: b.id,
        time_start: b.time_start,
        time_end: b.time_end,
        client_name: (b.players as Player[])?.[0]?.name ?? "",
      }));

    return { court, slots: computeAvailability(courtBookings, date) };
  });

  return { date, courts: result };
}

// ─── createBooking ────────────────────────────────────────────────────────────

export async function createBooking(
  params: CreateBookingParams,
): Promise<Booking> {
  const {
    courtId,
    date,
    timeStart,
    timeEnd,
    phone,
    gameType,
    players,
    isMember,
  } = params;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!courtId || !date || !timeStart || !timeEnd || !phone) {
    throw new Error("Faltan campos requeridos.");
  }
  if (!players?.length) throw new Error("Debe haber al menos un jugador.");

  const expectedCount = gameType === "doubles" ? 4 : 2;
  if (players.length !== expectedCount) {
    throw new Error(
      `Se requieren ${expectedCount} jugadores para ${gameType === "doubles" ? "dobles" : "singles"}.`,
    );
  }
  if (players.some((p) => !p.name.trim() || !p.phone.trim())) {
    throw new Error("Todos los jugadores deben tener nombre y teléfono.");
  }

  // ── Past-slot guard ─────────────────────────────────────────────────────────
  const today = getTodayISO();
  if (date < today)
    throw new Error("No se pueden hacer reservas en fechas pasadas.");
  if (date === today && timeStart <= getCurrentTimeHHMM()) {
    throw new Error("El horario seleccionado ya pasó.");
  }

  const client = await sb();

  // ── Overlap check ───────────────────────────────────────────────────────────
  const { data: existing, error: checkErr } = await client
    .from("bookings")
    .select("id, time_start, time_end")
    .eq("court_id", courtId)
    .eq("date", date)
    .eq("status", "confirmed");

  if (checkErr) {
    console.error("[db] overlap check error:", checkErr.message);
    throw new Error("Error al verificar disponibilidad.");
  }

  const conflict = (existing ?? []).find(
    (b: { time_start: string; time_end: string }) =>
      timesOverlap(timeStart, timeEnd, b.time_start, b.time_end),
  );
  if (conflict)
    throw new Error(`El horario ${timeStart}–${timeEnd} ya está ocupado.`);

  // ── Insert ──────────────────────────────────────────────────────────────────
  const { data: row, error: insertErr } = await client
    .from("bookings")
    .insert({
      court_id: courtId,
      date,
      time_start: timeStart,
      time_end: timeEnd,
      players: players.map((p) => ({
        name: p.name.trim(),
        phone: p.phone.trim(),
      })),
      game_type: gameType,
      is_member: isMember,
      phone: phone.trim(),
      status: "confirmed",
    })
    .select()
    .single();

  if (insertErr) {
    console.error("[db] insert error:", insertErr.message, insertErr.code);
    if (insertErr.code === "23P01" || insertErr.code === "23505") {
      throw new Error(
        "El horario fue tomado por otro usuario en este momento.",
      );
    }
    throw new Error("Error al crear la reserva.");
  }

  return rowToBooking(row as BookingRow);
}

// ─── cancelBooking ────────────────────────────────────────────────────────────

export async function cancelBooking(bookingId: string): Promise<Booking> {
  const client = await sb();

  const { data: row, error: fetchErr } = await client
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !row) throw new Error("Reserva no encontrada.");

  const booking = rowToBooking(row as BookingRow);

  if (booking.status === "cancelled")
    throw new Error("Este turno ya fue cancelado.");

  const today = getTodayISO();
  const now = getCurrentTimeHHMM();
  if (
    booking.date < today ||
    (booking.date === today && booking.time_start <= now)
  ) {
    throw new Error("No podés cancelar un turno que ya comenzó o ya pasó.");
  }

  const { data: updated, error: updateErr } = await client
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .select()
    .single();

  if (updateErr || !updated) {
    console.error("[db] cancel error:", updateErr?.message);
    throw new Error("Error al cancelar la reserva.");
  }

  return rowToBooking(updated as BookingRow);
}

// ─── getActiveBookings ────────────────────────────────────────────────────────

export async function getActiveBookings(phone?: string): Promise<Booking[]> {
  const client = await sb();
  const today = getTodayISO();
  const now = getCurrentTimeHHMM();

  let query = client
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("time_start", { ascending: true });

  if (phone) query = query.eq("phone", phone);

  const { data, error } = await query;

  if (error) {
    console.error("[db] getActiveBookings error:", error.message);
    throw new Error("Error al obtener reservas.");
  }

  return (data ?? [])
    .map((r) => rowToBooking(r as BookingRow))
    .filter((b) => !(b.date === today && b.time_end <= now));
}

// ─── getAllBookings ───────────────────────────────────────────────────────────

export async function getAllBookings(): Promise<Booking[]> {
  const client = await sb();

  const { data, error } = await client
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .order("date", { ascending: false })
    .order("time_start", { ascending: true });

  if (error) {
    console.error("[db] getAllBookings error:", error.message);
    throw new Error("Error al obtener reservas.");
  }

  return (data ?? []).map((r) => rowToBooking(r as BookingRow));
}
export type { Booking };
