// lib/schedule.ts
// Pure business logic — no framework dependencies

import { TimeSlot, Booking } from "@/types";

// Club operating hours
export const CLUB_OPEN_HOUR = 9; // 09:00
export const CLUB_CLOSE_HOUR = 21; // last slot ends at 22:00

/**
 * Generate all possible time slots for a day based on club hours.
 * e.g. 09:00, 10:00 … 21:00 → slots ending at 22:00
 */
export function generateDaySlots(): Array<{
  time_start: string;
  time_end: string;
}> {
  const slots = [];
  for (let hour = CLUB_OPEN_HOUR; hour < CLUB_CLOSE_HOUR; hour++) {
    slots.push({
      time_start: formatTime(hour),
      time_end: formatTime(hour + 1),
    });
  }
  return slots;
}

/**
 * Returns "HH:MM" of the current local time.
 * Kept as a separate function so tests can easily stub it.
 */
export function getCurrentTimeHHMM(): string {
  const now = new Date();
  return formatTime(now.getHours(), now.getMinutes());
}

/**
 * Returns today's date as "YYYY-MM-DD" in local time.
 */
export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Given a list of confirmed bookings for a court on a date,
 * returns all slots annotated with availability and past status.
 *
 * Rules:
 *  - past   = slot has already started (only relevant for today)
 *  - available = NOT booked AND NOT past
 */
export function computeAvailability(
  bookings: Pick<Booking, "id" | "time_start" | "time_end" | "client_name">[],
  date: string,
): TimeSlot[] {
  const allSlots = generateDaySlots();
  const today = getTodayISO();
  const isToday = date === today;
  const isPastDate = date < today;
  const nowHHMM = isToday ? getCurrentTimeHHMM() : null;

  return allSlots.map((slot) => {
    // A slot is "past" if it has already started (start time ≤ now).
    // For past dates every slot is past; for future dates none are.
    const past = isPastDate || (isToday && slot.time_start <= nowHHMM!);

    const conflict = bookings.find((b) =>
      timesOverlap(slot.time_start, slot.time_end, b.time_start, b.time_end),
    );

    return {
      time_start: slot.time_start,
      time_end: slot.time_end,
      past,
      available: !conflict && !past,
      booking: conflict
        ? { id: conflict.id, client_name: conflict.client_name }
        : undefined,
    };
  });
}

/**
 * Validate a booking request against past-slot rules.
 * Called by the POST /api/book handler before inserting.
 */
export function validateNotInPast(
  date: string,
  timeStart: string,
): string | null {
  const today = getTodayISO();
  if (date < today) return "No se pueden hacer reservas en fechas pasadas";
  if (date === today && timeStart <= getCurrentTimeHHMM()) {
    return "El horario seleccionado ya pasó";
  }
  return null;
}

/**
 * Check whether two time ranges overlap (half-open intervals [start, end))
 */
export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Validate a booking request's time range
 */
export function validateTimeRange(
  timeStart: string,
  timeEnd: string,
): string | null {
  if (!isValidTime(timeStart) || !isValidTime(timeEnd)) {
    return "Formato de hora inválido. Use HH:MM";
  }
  if (timeStart >= timeEnd) {
    return "La hora de inicio debe ser anterior a la hora de fin";
  }
  const startHour = parseInt(timeStart.split(":")[0]);
  const endHour = parseInt(timeEnd.split(":")[0]);
  if (startHour < CLUB_OPEN_HOUR || endHour > CLUB_CLOSE_HOUR + 1) {
    return `El club opera de ${formatTime(CLUB_OPEN_HOUR)} a ${formatTime(CLUB_CLOSE_HOUR + 1)}`;
  }
  return null;
}

/**
 * Validate a date string is a properly formatted date.
 */
export function validateDate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "Formato de fecha inválido. Use YYYY-MM-DD";
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Fecha inválida";
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(hour: number, minutes = 0): string {
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}
