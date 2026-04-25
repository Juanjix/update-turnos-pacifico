// components/MisTurnos.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
// 🔧 DB MODE — using Supabase via lib/db.ts
import { getActiveBookings, cancelBooking } from "@/lib/api-client";
import { Booking } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COURT_NAMES: Record<string, string> = {
  "1": "Cancha 1",
  "2": "Cancha 2",
  "3": "Cancha 3",
  "4": "Cancha 4",
  "5": "Cancha 5 (Cubierta)",
  "6": "Cancha 6 (Cubierta)",
};

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

// ─── Cancel confirmation modal ────────────────────────────────────────────────

function CancelModal({
  booking,
  onConfirm,
  onCancel,
  loading,
}: {
  booking: Booking;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}>
      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
        style={{
          background: "linear-gradient(160deg, #1a1208 0%, #130e08 100%)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          animation: "modalIn 0.25s cubic-bezier(0.32,0.72,0,1) both",
        }}>
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px) } to { opacity:1; transform:none } }`}</style>

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto"
          style={{
            background: "rgba(220,60,40,0.12)",
            border: "0.5px solid rgba(220,60,40,0.25)",
          }}>
          ⚠️
        </div>

        {/* Copy */}
        <div className="text-center">
          <h3 className="text-white font-bold text-lg mb-2">
            ¿Cancelar este turno?
          </h3>
          <div
            className="rounded-2xl px-4 py-3 text-left mb-3"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid rgba(255,255,255,0.08)",
            }}>
            <div className="text-white font-semibold text-sm">
              {COURT_NAMES[booking.court_id] ?? `Cancha ${booking.court_id}`}
            </div>
            <div className="text-white/50 text-xs mt-1">
              {capitalize(formatDate(booking.date))}
            </div>
            <div className="text-white/70 text-sm font-mono mt-0.5">
              {booking.time_start} – {booking.time_end}
            </div>
          </div>
          <p className="text-amber-400/80 text-xs leading-relaxed">
            El horario volverá a estar disponible para otros jugadores.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #c0392b 0%, #96281b 100%)",
            }}>
            {loading ? "Cancelando..." : "Confirmar cancelación"}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full py-3 rounded-2xl text-white/40 text-sm hover:text-white/70 transition-colors disabled:opacity-40">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single booking card ──────────────────────────────────────────────────────

function BookingCard({
  booking,
  onCancelClick,
  justCancelled,
}: {
  booking: Booking;
  onCancelClick: (b: Booking) => void;
  justCancelled: boolean;
}) {
  const courtName =
    COURT_NAMES[booking.court_id] ?? `Cancha ${booking.court_id}`;
  const isIndoor = booking.court_id === "5" || booking.court_id === "6";

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-500"
      style={{
        background: justCancelled
          ? "rgba(200,40,30,0.08)"
          : "rgba(255,255,255,0.04)",
        border: justCancelled
          ? "0.5px solid rgba(200,40,30,0.25)"
          : "0.5px solid rgba(255,255,255,0.08)",
        opacity: justCancelled ? 0.6 : 1,
      }}>
      {/* Court + status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {/* Mini court icon */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
            style={{
              background: isIndoor
                ? "rgba(180,80,30,0.2)"
                : "rgba(200,90,30,0.15)",
              border: "0.5px solid rgba(200,90,30,0.25)",
            }}>
            🎾
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{courtName}</div>
            <div className="text-white/30 text-[10px] uppercase tracking-widest font-mono">
              {isIndoor ? "Cubierta" : "Exterior"} ·{" "}
              {booking.game_type === "singles" ? "Singles" : "Dobles"}
            </div>
          </div>
        </div>

        {justCancelled ? (
          <span
            className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full"
            style={{
              background: "rgba(200,40,30,0.15)",
              color: "rgba(240,100,80,0.9)",
            }}>
            ❌ Cancelado
          </span>
        ) : (
          <span
            className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full"
            style={{
              background: "rgba(40,180,90,0.1)",
              color: "rgba(80,200,120,0.8)",
              border: "0.5px solid rgba(40,180,90,0.2)",
            }}>
            Activo
          </span>
        )}
      </div>

      {/* Date + time */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/25 font-mono mb-0.5">
            Fecha
          </div>
          <div className="text-white/80 text-sm">
            {capitalize(formatDate(booking.date))}
          </div>
        </div>
        <div
          className="w-px self-stretch"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/25 font-mono mb-0.5">
            Horario
          </div>
          <div className="text-white font-mono font-semibold text-sm">
            {booking.time_start} – {booking.time_end}
          </div>
        </div>
      </div>

      {/* Players */}
      <div
        className="rounded-xl px-3 py-2.5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.06)",
        }}>
        <div className="text-[10px] uppercase tracking-widest text-white/20 font-mono mb-1.5">
          Jugadores
        </div>
        <div className="space-y-1">
          {booking.players.map((p, i) => (
            <div key={i} className="flex justify-between items-baseline">
              <span className="text-white/65 text-xs">{p.name}</span>
              <span className="text-white/25 text-[10px] font-mono">
                {p.phone}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel button */}
      {!justCancelled && (
        <button
          onClick={() => onCancelClick(booking)}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
          style={{
            background: "rgba(200,40,30,0.08)",
            border: "0.5px solid rgba(200,40,30,0.2)",
            color: "rgba(240,100,80,0.9)",
          }}>
          Cancelar turno
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MisTurnosProps {
  /** If provided, pre-filters bookings by phone on load */
  defaultPhone?: string;
}

export function MisTurnos({ defaultPhone }: MisTurnosProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelected] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [phoneFilter, setPhoneFilter] = useState(defaultPhone ?? "");

  const loadBookings = useCallback(async (phone?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActiveBookings(phone || undefined);
      setBookings(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar turnos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings(phoneFilter);
  }, []); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBookings(phoneFilter);
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;
    setCancelling(true);
    try {
      await cancelBooking(selectedBooking.id);
      setCancelledIds((prev) => new Set([...prev, selectedBooking.id]));
      setSelected(null);
      // Refresh list after short delay so user sees the "cancelled" state
      setTimeout(() => loadBookings(phoneFilter), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cancelar");
      setSelected(null);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Cancel modal */}
      {selectedBooking && (
        <CancelModal
          booking={selectedBooking}
          loading={cancelling}
          onConfirm={handleCancelConfirm}
          onCancel={() => setSelected(null)}
        />
      )}

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-white font-bold text-xl tracking-tight">
          Mis turnos
        </h2>
        <p className="text-white/30 text-sm mt-0.5">Turnos activos del club</p>
      </div>

      {/* Phone search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <input
          type="tel"
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
          placeholder="Buscar por teléfono..."
          inputMode="tel"
          className="flex-1 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all active:scale-[0.97]"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}>
          Buscar
        </button>
        {phoneFilter && (
          <button
            type="button"
            onClick={() => {
              setPhoneFilter("");
              loadBookings();
            }}
            className="px-3 py-2.5 rounded-xl text-white/40 text-sm hover:text-white/70 transition-colors">
            ✕
          </button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300"
          style={{
            background: "rgba(200,40,40,0.12)",
            border: "0.5px solid rgba(200,40,40,0.2)",
          }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-7 h-7 rounded-full border-2 border-t-orange-400 animate-spin"
            style={{
              borderColor: "rgba(200,90,30,0.3)",
              borderTopColor: "rgba(200,90,30,0.9)",
            }}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-white/60 font-medium mb-1">Sin turnos activos</p>
          <p className="text-white/25 text-sm">
            {phoneFilter
              ? `No hay turnos para ese teléfono`
              : "No hay reservas pendientes"}
          </p>
        </div>
      )}

      {/* Booking cards */}
      {!loading && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancelClick={setSelected}
              justCancelled={cancelledIds.has(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
