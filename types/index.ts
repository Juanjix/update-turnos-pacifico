// types/index.ts

export type CourtType = "indoor" | "outdoor";
export type BookingStatus = "confirmed" | "cancelled";
// DB-level status (new bookings use 'confirmed', cancel sets 'cancelled')
// Note: mockBackend historically used 'confirmed'; Supabase schema uses same values.

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  created_at?: string;
}

export type GameType = "singles" | "doubles";

export interface Player {
  name: string;
  phone: string;
}

export type Booking = {
  id: string;
  court_id: string;
  date: string; // ISO date: "2025-01-15"
  time_start: string; // "09:00"
  time_end: string; // "10:00"
  // Legacy flat fields — derived from players[0], kept for schedule.ts compat
  client_name: string;
  client_phone: string;
  // Extended fields
  game_type: GameType;
  players: Player[];
  is_member: boolean;
  phone: string; // primary contact phone (for WhatsApp lookup)
  status: BookingStatus;
  created_at?: string;
};

export interface TimeSlot {
  time_start: string;
  time_end: string;
  available: boolean; // false if booked OR past
  past: boolean; // true if slot has already started (today only)
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

export interface BookingRequest {
  courtId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  // Legacy (kept for API route backward-compat)
  name: string;
  phone: string;
  // Extended
  gameType: GameType;
  players: Player[];
  isMember: boolean;
}

export interface BookingResponse {
  success: boolean;
  booking?: Booking;
  error?: string;
}

// Court positions on the map (percentage-based for responsive layout)
export interface CourtMapPosition {
  id: string;
  x: number; // left %
  y: number; // top %
}
