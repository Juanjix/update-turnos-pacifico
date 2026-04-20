// lib/api-client.ts
// Reusable functions used by both UI components and future integrations (WhatsApp bot, etc.)

import {
  AvailabilityResponse,
  BookingRequest,
  BookingResponse,
} from '@/types'

const BASE = '/api'

/**
 * Fetch availability for all courts on a given date.
 * Used by the map UI and any future channel (WhatsApp, chatbot, etc.)
 */
export async function getAvailability(date: string): Promise<AvailabilityResponse> {
  const res = await fetch(`${BASE}/availability?date=${encodeURIComponent(date)}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Error al obtener disponibilidad (${res.status})`)
  }
  return res.json()
}

/**
 * Create a booking.
 * Returns the created booking or throws with a descriptive error.
 */
export async function createBooking(req: BookingRequest): Promise<BookingResponse> {
  const res = await fetch(`${BASE}/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  const data: BookingResponse = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? `Error al crear reserva (${res.status})`)
  }
  return data
}
