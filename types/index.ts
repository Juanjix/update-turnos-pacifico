// types/index.ts

export type CourtType = "indoor" | "outdoor";
export type BookingStatus = "confirmed" | "cancelled";

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  created_at?: string;
}

export interface Booking {
  id: string;
  court_id: string;
  date: string; // ISO date: "2025-01-15"
  time_start: string; // "09:00"
  time_end: string; // "10:00"
  client_name: string;
  client_phone: string;
  status: BookingStatus;
  created_at?: string;
}

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
  name: string;
  phone: string;
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
