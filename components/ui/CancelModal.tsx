// components/ui/CancelModal.tsx
"use client";

import { Booking } from "@/types";

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const COURT_NAMES: Record<string, string> = {
  "1": "Cancha 1",
  "2": "Cancha 2",
  "3": "Cancha 3",
  "4": "Cancha 4",
  "5": "Cancha 5 (Cubierta)",
  "6": "Cancha 6 (Cubierta)",
};

interface CancelModalProps {
  booking: Booking;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CancelModal({
  booking,
  loading = false,
  onConfirm,
  onCancel,
}: CancelModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}>
      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
        style={{
          background: "linear-gradient(160deg, #1a1008 0%, #130c06 100%)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          animation: "cancelModalIn 0.25s cubic-bezier(0.32,0.72,0,1) both",
        }}>
        <style>{`
          @keyframes cancelModalIn {
            from { opacity: 0; transform: scale(0.93) translateY(10px) }
            to   { opacity: 1; transform: scale(1) translateY(0) }
          }
        `}</style>

        {/* Warning icon */}
        <div className="flex justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background: "rgba(220,60,40,0.12)",
              border: "0.5px solid rgba(220,60,40,0.25)",
            }}>
            ⚠️
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-white font-bold text-xl mb-1">Cancelar turno</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Esta acción no se puede deshacer
          </p>
        </div>

        {/* Booking summary */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}>
          <div className="space-y-2.5">
            {[
              {
                label: "Cancha",
                value:
                  COURT_NAMES[booking.court_id] ?? `Cancha ${booking.court_id}`,
              },
              { label: "Fecha", value: capitalize(formatDate(booking.date)) },
              {
                label: "Horario",
                value: `${booking.time_start} – ${booking.time_end}`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-baseline gap-3">
                <span className="text-white/25 text-xs font-mono uppercase tracking-widest flex-shrink-0">
                  {label}
                </span>
                <span className="text-white/80 text-sm text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div
          className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
          style={{
            background: "rgba(230,160,20,0.08)",
            border: "0.5px solid rgba(230,160,20,0.15)",
          }}>
          <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
          <p className="text-amber-300/70 text-xs leading-relaxed">
            El horario volverá a estar disponible para otros jugadores
            inmediatamente.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.97] disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #c0392b 0%, #96281b 100%)",
            }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Cancelando...
              </span>
            ) : (
              "Confirmar cancelación"
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full py-3 rounded-2xl text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-40">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
