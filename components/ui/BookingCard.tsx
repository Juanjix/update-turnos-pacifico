// components/ui/BookingCard.tsx
"use client";

import { Booking } from "@/types";

const COURT_NAMES: Record<string, string> = {
  "1": "Cancha 1",
  "2": "Cancha 2",
  "3": "Cancha 3",
  "4": "Cancha 4",
  "5": "Cancha 5",
  "6": "Cancha 6",
};
const COURT_TYPE: Record<string, "indoor" | "outdoor"> = {
  "1": "outdoor",
  "2": "outdoor",
  "3": "outdoor",
  "4": "outdoor",
  "5": "indoor",
  "6": "indoor",
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

interface BookingCardProps {
  booking: Booking;
  onCancel: (b: Booking) => void;
  cancelled?: boolean;
}

export function BookingCard({
  booking,
  onCancel,
  cancelled = false,
}: BookingCardProps) {
  const courtName =
    COURT_NAMES[booking.court_id] ?? `Cancha ${booking.court_id}`;
  const isIndoor = COURT_TYPE[booking.court_id] === "indoor";

  const accentColor = isIndoor
    ? {
        bg: "rgba(30,80,160,0.2)",
        border: "rgba(60,120,220,0.3)",
        dot: "#60a5fa",
      }
    : {
        bg: "rgba(180,70,20,0.18)",
        border: "rgba(200,90,30,0.3)",
        dot: "#fb923c",
      };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        background: cancelled
          ? "rgba(180,30,20,0.07)"
          : "rgba(255,255,255,0.04)",
        border: cancelled
          ? "0.5px solid rgba(200,40,30,0.2)"
          : `0.5px solid ${accentColor.border}`,
        opacity: cancelled ? 0.55 : 1,
      }}>
      {/* Top accent strip */}
      <div
        className="h-0.5 w-full"
        style={{
          background: cancelled
            ? "rgba(200,40,30,0.4)"
            : `linear-gradient(90deg, ${accentColor.dot}, transparent)`,
        }}
      />

      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          {/* Court icon + name */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{
                background: accentColor.bg,
                border: `0.5px solid ${accentColor.border}`,
              }}>
              🎾
            </div>
            <div>
              <div className="text-white font-semibold text-sm">
                {courtName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: accentColor.dot }}
                />
                <span
                  className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: accentColor.dot, opacity: 0.8 }}>
                  {isIndoor ? "Cubierta" : "Exterior"}
                </span>
              </div>
            </div>
          </div>

          {/* Status badge */}
          {cancelled ? (
            <span
              className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0"
              style={{
                background: "rgba(200,40,30,0.15)",
                color: "rgba(240,100,80,0.9)",
                border: "0.5px solid rgba(200,40,30,0.25)",
              }}>
              Cancelado
            </span>
          ) : (
            <span
              className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0"
              style={{
                background: "rgba(40,160,80,0.1)",
                color: "rgba(80,210,120,0.85)",
                border: "0.5px solid rgba(40,160,80,0.2)",
              }}>
              Activo
            </span>
          )}
        </div>

        {/* Info grid */}
        <div
          className="grid grid-cols-2 gap-px rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          {[
            { label: "Fecha", value: formatDate(booking.date) },
            {
              label: "Horario",
              value: `${booking.time_start} – ${booking.time_end}`,
            },
            {
              label: "Modalidad",
              value:
                booking.game_type === "singles"
                  ? "Singles (1v1)"
                  : "Dobles (2v2)",
            },
            {
              label: "Condición",
              value: booking.is_member ? "Socio ✓" : "No socio",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="px-3 py-2.5"
              style={{ background: "rgba(8,15,10,0.6)" }}>
              <div
                className="text-[9px] uppercase tracking-widest font-mono mb-0.5"
                style={{ color: "rgba(255,255,255,0.2)" }}>
                {label}
              </div>
              <div className="text-white/80 text-xs font-medium leading-tight">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Players */}
        {booking.players?.length > 0 && (
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.06)",
            }}>
            <div
              className="text-[9px] uppercase tracking-widest font-mono mb-2"
              style={{ color: "rgba(255,255,255,0.2)" }}>
              Jugadores
            </div>
            <div className="space-y-1">
              {booking.players.map((p, i) => (
                <div
                  key={i}
                  className="flex justify-between items-baseline gap-2">
                  <span className="text-white/65 text-xs truncate">
                    {p.name}
                  </span>
                  <span className="text-white/25 text-[10px] font-mono flex-shrink-0">
                    {p.phone}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancel button */}
        {!cancelled && (
          <button
            onClick={() => onCancel(booking)}
            className="w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all duration-150 active:scale-[0.98] mt-1"
            style={{
              background: "rgba(200,40,30,0.08)",
              border: "0.5px solid rgba(200,40,30,0.2)",
              color: "rgba(240,100,80,0.85)",
            }}>
            Cancelar turno
          </button>
        )}
      </div>
    </div>
  );
}
