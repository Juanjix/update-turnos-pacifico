// lib/db.ts
// Supabase implementation of the booking backend.
// Drop-in replacement for lib/mockBackend.ts — identical function signatures.
//
// SWITCHING FROM MOCK → DB:
//   In any file that imports from '@/lib/mockBackend', change to '@/lib/db'.
//   No other changes needed.
//
// Migration path for each function is documented inline.

import { getServerClient } from "@/lib/supabase";
import {
  Booking,
  BookingStatus,
  Court,
  CourtAvailability,
  AvailabilityResponse,
  GameType,
  Player,
} from "@/types";
import {
  generateDaySlots,
  computeAvailability,
  getTodayISO,
  getCurrentTimeHHMM,
  timesOverlap,
} from "@/lib/schedule";

// ─── Static court list ────────────────────────────────────────────────────────
// Courts are seeded via SQL. We fetch from DB so future additions don't need
// a code deploy. Falls back to hardcoded list if DB is unavailable.

const FALLBACK_COURTS: Court[] = [
  { id: "1", name: "Cancha 1", type: "outdoor" },
  { id: "2", name: "Cancha 2", type: "outdoor" },
  { id: "3", name: "Cancha 3", type: "outdoor" },
  { id: "4", name: "Cancha 4", type: "outdoor" },
  { id: "5", name: "Cancha 5 (Cubierta)", type: "indoor" },
  { id: "6", name: "Cancha 6 (Cubierta)", type: "indoor" },
];

async function fetchCourts(): Promise<Court[]> {
  const sb = getServerClient();
  const { data, error } = await sb.from("courts").select("*").order("name");
  if (error || !data?.length) {
    console.warn(
      "[db] Could not fetch courts from DB, using fallback:",
      error?.message,
    );
    return FALLBACK_COURTS;
  }
  return data as Court[];
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateBookingParams {
  courtId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  name: string; // first player (legacy compat)
  phone: string; // primary contact / WhatsApp lookup key
  gameType: GameType;
  players: Player[];
  isMember: boolean;
}

// ─── Row shape coming from Supabase ──────────────────────────────────────────
// Supabase returns snake_case; we map to our Booking interface.

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

// ─── getAvailability ──────────────────────────────────────────────────────────

export async function getAvailability(
  date: string,
): Promise<AvailabilityResponse> {
  const sb = getServerClient();

  const [courts, { data: rows, error }] = await Promise.all([
    fetchCourts(),
    sb
      .from("bookings")
      .select("id, court_id, time_start, time_end, players, status")
      .eq("date", date)
      .eq("status", "confirmed"),
  ]);

  if (error) {
    console.error("[db] getAvailability error:", error.message);
    throw new Error("Error al obtener disponibilidad");
  }

  const bookings = (rows ?? []) as Pick<
    BookingRow,
    "id" | "court_id" | "time_start" | "time_end" | "players" | "status"
  >[];

  const result: CourtAvailability[] = courts.map((court) => {
    const courtBookings = bookings
      .filter((b) => b.court_id === court.id)
      .map((b) => ({
        id: b.id,
        time_start: b.time_start,
        time_end: b.time_end,
        client_name: b.players?.[0]?.name ?? "",
      }));

    return {
      court,
      slots: computeAvailability(courtBookings, date),
    };
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
  const sb = getServerClient();

  // ── Input validation ──────────────────────────────────────────────────────
  if (!courtId || !date || !timeStart || !timeEnd || !phone) {
    throw new Error("Faltan campos requeridos.");
  }
  if (!players?.length) {
    throw new Error("Debe haber al menos un jugador.");
  }
  const expectedCount = gameType === "doubles" ? 4 : 2;
  if (players.length !== expectedCount) {
    throw new Error(
      `Se requieren ${expectedCount} jugadores para ${gameType === "doubles" ? "dobles" : "singles"}.`,
    );
  }
  if (players.some((p) => !p.name.trim() || !p.phone.trim())) {
    throw new Error("Todos los jugadores deben tener nombre y teléfono.");
  }

  // ── Past-slot guard ───────────────────────────────────────────────────────
  const today = getTodayISO();
  if (date < today)
    throw new Error("No se pueden hacer reservas en fechas pasadas.");
  if (date === today && timeStart <= getCurrentTimeHHMM()) {
    throw new Error("El horario seleccionado ya pasó.");
  }

  // ── Overlap check (application-level — DB constraint is the safety net) ───
  const { data: existing, error: checkErr } = await sb
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
  if (conflict) {
    throw new Error(`El horario ${timeStart}–${timeEnd} ya está ocupado.`);
  }

  // ── Insert ────────────────────────────────────────────────────────────────
  const { data: row, error: insertErr } = await sb
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
    // Postgres exclusion constraint or unique violation
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
  const sb = getServerClient();

  // Fetch first to validate
  const { data: row, error: fetchErr } = await sb
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !row) {
    throw new Error("Reserva no encontrada.");
  }

  const booking = rowToBooking(row as BookingRow);

  if (booking.status === "cancelled") {
    throw new Error("Este turno ya fue cancelado.");
  }

  // Prevent cancelling a slot that already started
  const today = getTodayISO();
  const now = getCurrentTimeHHMM();
  if (
    booking.date < today ||
    (booking.date === today && booking.time_start <= now)
  ) {
    throw new Error("No podés cancelar un turno que ya comenzó o ya pasó.");
  }

  const { data: updated, error: updateErr } = await sb
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
// Returns upcoming confirmed bookings, optionally filtered by phone.
// Used by: MisTurnos component + WhatsApp cancel flow.

export async function getActiveBookings(phone?: string): Promise<Booking[]> {
  const sb = getServerClient();
  const today = getTodayISO();
  const now = getCurrentTimeHHMM();

  let query = sb
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .gte("date", today) // no past dates
    .order("date", { ascending: true })
    .order("time_start", { ascending: true });

  if (phone) {
    // Exact match on the stored phone field
    query = query.eq("phone", phone);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[db] getActiveBookings error:", error.message);
    throw new Error("Error al obtener reservas.");
  }

  // Filter out same-day bookings that have already ended (can't cancel those anyway)
  return (data ?? [])
    .map((r) => rowToBooking(r as BookingRow))
    .filter((b) => !(b.date === today && b.time_end <= now));
}

// ─── getAllBookings ───────────────────────────────────────────────────────────
// Admin/debug view — all confirmed bookings.

export async function getAllBookings(): Promise<Booking[]> {
  const sb = getServerClient();
  const { data, error } = await sb
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
