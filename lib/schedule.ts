// lib/schedule.ts
// Pure business logic — no framework dependencies

import { TimeSlot, Booking } from '@/types'

// Club operating hours
export const CLUB_OPEN_HOUR = 8   // 08:00
export const CLUB_CLOSE_HOUR = 22 // 22:00
export const SLOT_DURATION_MINUTES = 60

/**
 * Generate all possible time slots for a day based on club hours.
 * e.g. ["08:00", "09:00", ..., "21:00"] → slots ending at 22:00
 */
export function generateDaySlots(): Array<{ time_start: string; time_end: string }> {
  const slots = []
  for (let hour = CLUB_OPEN_HOUR; hour < CLUB_CLOSE_HOUR; hour++) {
    slots.push({
      time_start: formatTime(hour, 0),
      time_end: formatTime(hour + 1, 0),
    })
  }
  return slots
}

/**
 * Given a list of confirmed bookings for a court on a date,
 * returns all slots with availability status.
 */
export function computeAvailability(
  bookings: Pick<Booking, 'id' | 'time_start' | 'time_end' | 'client_name'>[]
): TimeSlot[] {
  const slots = generateDaySlots()

  return slots.map((slot) => {
    const conflict = bookings.find((b) =>
      timesOverlap(slot.time_start, slot.time_end, b.time_start, b.time_end)
    )

    return {
      time_start: slot.time_start,
      time_end: slot.time_end,
      available: !conflict,
      booking: conflict
        ? { id: conflict.id, client_name: conflict.client_name }
        : undefined,
    }
  })
}

/**
 * Check whether two time ranges overlap (half-open intervals [start, end))
 */
export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB
}

/**
 * Validate a booking request's time range
 */
export function validateTimeRange(timeStart: string, timeEnd: string): string | null {
  if (!isValidTime(timeStart) || !isValidTime(timeEnd)) {
    return 'Formato de hora inválido. Use HH:MM'
  }
  if (timeStart >= timeEnd) {
    return 'La hora de inicio debe ser anterior a la hora de fin'
  }
  const startHour = parseInt(timeStart.split(':')[0])
  const endHour = parseInt(timeEnd.split(':')[0])
  if (startHour < CLUB_OPEN_HOUR || endHour > CLUB_CLOSE_HOUR) {
    return `El club opera de ${formatTime(CLUB_OPEN_HOUR, 0)} a ${formatTime(CLUB_CLOSE_HOUR, 0)}`
  }
  return null
}

/**
 * Validate a date string is a real future date
 */
export function validateDate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return 'Formato de fecha inválido. Use YYYY-MM-DD'
  }
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    return 'Fecha inválida'
  }
  return null
}

// --- Helpers ---

function formatTime(hour: number, minutes: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time)
}
