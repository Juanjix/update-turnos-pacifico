// lib/api-client.ts
// Client-side functions — use fetch() to call API routes.
// Safe to import from 'use client' components: zero server deps, no env vars at build time.

import {
  AvailabilityResponse,
  Booking,
  BookingRequest,
  BookingResponse,
  GameType,
  Player,
} from "@/types";

// ─── Availability ─────────────────────────────────────────────────────────────

export async function getAvailability(
  date: string,
): Promise<AvailabilityResponse> {
  const res = await fetch(
    `/api/availability?date=${encodeURIComponent(date)}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error ?? `Error al obtener disponibilidad (${res.status})`,
    );
  }
  return res.json();
}

// ─── Create booking ───────────────────────────────────────────────────────────

export async function createBooking(params: {
  courtId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  name: string;
  phone: string;
  gameType: GameType;
  players: Player[];
  isMember: boolean;
}): Promise<Booking> {
  const res = await fetch("/api/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data: BookingResponse = await res.json();
  if (!res.ok || !data.success)
    throw new Error(data.error ?? "Error al crear reserva");
  return data.booking!;
}

// ─── Active bookings ──────────────────────────────────────────────────────────

export async function getActiveBookings(phone?: string): Promise<Booking[]> {
  const url = phone
    ? `/api/cancel?phone=${encodeURIComponent(phone)}`
    : "/api/cancel";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener reservas");
  const data = await res.json();
  return data.bookings as Booking[];
}

// ─── Cancel booking ───────────────────────────────────────────────────────────

export async function cancelBooking(bookingId: string): Promise<Booking> {
  const res = await fetch("/api/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success)
    throw new Error(data.error ?? "Error al cancelar");
  return data.booking as Booking;
}
