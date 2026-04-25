// lib/mockBackend.ts
// In-memory mock backend — designed to mirror the real Supabase implementation.
// Swap out each function body for a fetch() call to /api/* when ready to go live.

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type CourtType = "indoor" | "outdoor";
export type BookingStatus = "confirmed" | "cancelled";

export interface Court {
  id: string;
  name: string;
  type: CourtType;
}

export type GameType = "singles" | "doubles";

export interface Player {
  name: string;
  phone: string;
}

export interface Booking {
  id: string;
  court_id: string;
  date: string;
  time_start: string;
  time_end: string;
  client_name: string; // first player name (legacy compat)
  client_phone: string; // first player phone (legacy compat)
  game_type: GameType;
  players: Player[];
  is_member: boolean;
  status: BookingStatus;
  created_at: string;
}

export interface TimeSlot {
  time_start: string;
  time_end: string;
  available: boolean; // false if booked OR past
  past: boolean; // true if slot has already started
  booking?: Pick<Booking, "id" | "client_name">;
}

export interface CourtAvailability {
  court: Court;
  slots: TimeSlot[];
}

export interface AvailabilityResponse {
  date: string;
  courts: CourtAvailability[];
}

export interface CreateBookingParams {
  courtId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  name: string; // first player (legacy)
  phone: string; // first player (legacy)
  gameType: GameType;
  players: Player[];
  isMember: boolean;
}

// ─────────────────────────────────────────────
// In-memory "database"
// ─────────────────────────────────────────────

const courts: Court[] = [
  { id: "1", name: "Cancha 1", type: "outdoor" },
  { id: "2", name: "Cancha 2", type: "outdoor" },
  { id: "3", name: "Cancha 3", type: "outdoor" },
  { id: "4", name: "Cancha 4", type: "outdoor" },
  { id: "5", name: "Cancha 5 (Cubierta)", type: "indoor" },
  { id: "6", name: "Cancha 6 (Cubierta)", type: "indoor" },
];

let bookings: Booking[] = [];

// ─────────────────────────────────────────────
// Schedule config
// ─────────────────────────────────────────────

const OPEN_HOUR = 9; // 09:00
const CLOSE_HOUR = 21; // last slot ends at 22:00 — adjust if needed
const SIMULATED_LATENCY_MS = 500;

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

function pad(n: number, digits = 2): string {
  return String(n).padStart(digits, "0");
}

function generateSlots(): Array<{ time_start: string; time_end: string }> {
  const slots = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    slots.push({
      time_start: `${pad(hour)}:00`,
      time_end: `${pad(hour + 1)}:00`,
    });
  }
  return slots;
}

/** "YYYY-MM-DD" of today in local time */
function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "HH:MM" of right now in local time */
function getCurrentHHMM(): string {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Half-open interval overlap: [startA, endA) overlaps [startB, endB) */
function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && endA > startB;
}

function simDelay(): Promise<void> {
  return new Promise((res) => setTimeout(res, SIMULATED_LATENCY_MS));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Returns all courts with their time slots for a given date,
 * marking each slot as available or booked.
 *
 * Migration path → replace body with:
 *   const res = await fetch(`/api/availability?date=${date}`)
 *   return res.json()
 */
export async function getAvailability(
  date: string,
): Promise<AvailabilityResponse> {
  await simDelay();

  const today = getTodayISO();
  const isToday = date === today;
  const isPastDate = date < today;
  const nowHHMM = isToday ? getCurrentHHMM() : null;

  const dayBookings = bookings.filter(
    (b) => b.date === date && b.status === "confirmed",
  );

  const allSlots = generateSlots();

  const result: CourtAvailability[] = courts.map((court) => {
    const courtBookings = dayBookings.filter((b) => b.court_id === court.id);

    const slots: TimeSlot[] = allSlots.map((slot) => {
      // Slot is "past" if it has already started
      const past = isPastDate || (isToday && slot.time_start <= nowHHMM!);

      const conflict = courtBookings.find((b) =>
        overlaps(slot.time_start, slot.time_end, b.time_start, b.time_end),
      );

      return {
        time_start: slot.time_start,
        time_end: slot.time_end,
        past,
        available: !conflict && !past,
        ...(conflict
          ? { booking: { id: conflict.id, client_name: conflict.client_name } }
          : {}),
      };
    });

    return { court, slots };
  });

  return { date, courts: result };
}

/**
 * Creates a booking if the slot is free; throws if it conflicts.
 *
 * Migration path → replace body with:
 *   const res = await fetch('/api/book', { method: 'POST', body: JSON.stringify(params), headers: { 'Content-Type': 'application/json' } })
 *   const data = await res.json()
 *   if (!data.success) throw new Error(data.error)
 *   return data.booking
 */
export async function createBooking(
  params: CreateBookingParams,
): Promise<Booking> {
  await simDelay();

  const {
    courtId,
    date,
    timeStart,
    timeEnd,
    name,
    phone,
    gameType,
    players,
    isMember,
  } = params;

  // ── Validate inputs ──────────────────────────────────────────
  if (!courtId || !date || !timeStart || !timeEnd) {
    throw new Error("Todos los campos son requeridos.");
  }
  if (!players || players.length === 0) {
    throw new Error("Debe haber al menos un jugador.");
  }
  const expectedPlayers = gameType === "doubles" ? 4 : 2;
  if (players.length !== expectedPlayers) {
    throw new Error(
      `Se requieren ${expectedPlayers} jugadores para ${gameType === "doubles" ? "dobles" : "singles"}.`,
    );
  }
  if (players.some((p) => !p.name.trim() || !p.phone.trim())) {
    throw new Error("Todos los jugadores deben tener nombre y teléfono.");
  }
  if (!courts.find((c) => c.id === courtId)) {
    throw new Error("Cancha no encontrada.");
  }

  // ── Past-slot guard ───────────────────────────────────────────
  const today = getTodayISO();
  if (date < today) {
    throw new Error("No se pueden hacer reservas en fechas pasadas.");
  }
  if (date === today && timeStart <= getCurrentHHMM()) {
    throw new Error("El horario seleccionado ya pasó.");
  }

  // ── Check for overlap ────────────────────────────────────────
  const conflict = bookings.find(
    (b) =>
      b.court_id === courtId &&
      b.date === date &&
      b.status === "confirmed" &&
      overlaps(timeStart, timeEnd, b.time_start, b.time_end),
  );

  if (conflict) {
    throw new Error(
      `El horario ${timeStart}–${timeEnd} ya está reservado para esta cancha.`,
    );
  }

  // ── Persist ──────────────────────────────────────────────────
  const newBooking: Booking = {
    id: generateId(),
    court_id: courtId,
    date,
    time_start: timeStart,
    time_end: timeEnd,
    client_name: players[0].name.trim(),
    client_phone: players[0].phone.trim(),
    game_type: gameType,
    players: players.map((p) => ({
      name: p.name.trim(),
      phone: p.phone.trim(),
    })),
    is_member: isMember,
    status: "confirmed",
    created_at: new Date().toISOString(),
  };

  bookings = [...bookings, newBooking];

  return newBooking;
}

/**
 * Cancel an existing booking by ID.
 * Validates: exists, is confirmed, has not already started.
 *
 * Migration path → PATCH /api/book/:id { status: 'cancelled' }
 */
export async function cancelBooking(bookingId: string): Promise<Booking> {
  await simDelay();

  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) throw new Error("Reserva no encontrada.");
  if (booking.status === "cancelled")
    throw new Error("Este turno ya fue cancelado.");

  // Prevent cancelling a booking that has already started
  const today = getTodayISO();
  const now = getCurrentHHMM();
  if (
    booking.date < today ||
    (booking.date === today && booking.time_start <= now)
  ) {
    throw new Error("No podés cancelar un turno que ya comenzó o ya pasó.");
  }

  const updated: Booking = { ...booking, status: "cancelled" };
  bookings = bookings.map((b) => (b.id === bookingId ? updated : b));
  return updated;
}

/**
 * Return all active (confirmed) bookings — optionally filtered by phone number.
 * Used by web UI "Mis Turnos" and WhatsApp cancel flow.
 *
 * Migration path → GET /api/bookings?phone=...
 */
export async function getActiveBookings(phone?: string): Promise<Booking[]> {
  await simDelay();
  const today = getTodayISO();
  const now = getCurrentHHMM();

  return bookings.filter((b) => {
    if (b.status !== "confirmed") return false;
    // Exclude bookings already in the past
    if (b.date < today) return false;
    if (b.date === today && b.time_end <= now) return false;
    // Phone filter: match against any player's phone
    if (phone) {
      const normalised = phone.replace(/\D/g, "");
      return b.players.some((p) =>
        p.phone.replace(/\D/g, "").endsWith(normalised.slice(-8)),
      );
    }
    return true;
  });
}

/**
 * Return all bookings (useful for admin views / debugging).
 *
 * Migration path → GET /api/bookings
 */
export async function getAllBookings(): Promise<Booking[]> {
  await simDelay();
  return bookings.filter((b) => b.status === "confirmed");
}

// ─────────────────────────────────────────────
// Dev utility — seed some bookings for testing
// ─────────────────────────────────────────────

export function seedBookings(date: string): void {
  bookings = [
    {
      id: "seed-1",
      court_id: "1",
      date,
      time_start: "10:00",
      time_end: "11:00",
      client_name: "Martín López",
      client_phone: "+54 9 11 2345-6789",
      game_type: "singles",
      players: [
        { name: "Martín López", phone: "+54 9 11 2345-6789" },
        { name: "Carlos Ruiz", phone: "+54 9 11 9876-5432" },
      ],
      is_member: true,
      status: "confirmed",
      created_at: new Date().toISOString(),
    },
    {
      id: "seed-2",
      court_id: "1",
      date,
      time_start: "14:00",
      time_end: "15:00",
      client_name: "Sofía Ramírez",
      client_phone: "+54 9 11 3456-7890",
      game_type: "singles",
      players: [
        { name: "Sofía Ramírez", phone: "+54 9 11 3456-7890" },
        { name: "Laura Gómez", phone: "+54 9 11 1111-2222" },
      ],
      is_member: false,
      status: "confirmed",
      created_at: new Date().toISOString(),
    },
    {
      id: "seed-3",
      court_id: "5",
      date,
      time_start: "09:00",
      time_end: "10:00",
      client_name: "Diego Fernández",
      client_phone: "+54 9 11 4567-8901",
      game_type: "doubles",
      players: [
        { name: "Diego Fernández", phone: "+54 9 11 4567-8901" },
        { name: "Lucas Pérez", phone: "+54 9 11 2222-3333" },
        { name: "Andrés Silva", phone: "+54 9 11 3333-4444" },
        { name: "Tomás Ríos", phone: "+54 9 11 4444-5555" },
      ],
      is_member: true,
      status: "confirmed",
      created_at: new Date().toISOString(),
    },
  ];
}
