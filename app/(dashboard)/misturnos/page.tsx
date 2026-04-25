// app/(dashboard)/mis-turnos/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { BookingCard } from "@/components/ui/BookingCard";
import { CancelModal } from "@/components/ui/CancelModal";
import { getActiveBookings, cancelBooking } from "@/lib/db";
import { Booking } from "@/types";

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatGroupDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.getTime() === today.getTime()) return "Hoy";
  if (date.getTime() === tomorrow.getTime()) return "Mañana";
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Group bookings by date
function groupByDate(bookings: Booking[]): Map<string, Booking[]> {
  const map = new Map<string, Booking[]>();
  for (const b of bookings) {
    const existing = map.get(b.date) ?? [];
    map.set(b.date, [...existing, b]);
  }
  return map;
}

export default function MisTurnosPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async (phone?: string) => {
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
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneFilter(phoneInput);
    load(phoneInput);
  };

  const handleClearSearch = () => {
    setPhoneInput("");
    setPhoneFilter("");
    load();
  };

  const handleCancelConfirm = async () => {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await cancelBooking(toCancel.id);
      setCancelledIds((prev) => new Set([...prev, toCancel.id]));
      setSuccessMsg(
        `Turno cancelado: Cancha ${toCancel.court_id} · ${toCancel.time_start}`,
      );
      setToCancel(null);
      setTimeout(() => {
        setSuccessMsg(null);
        load(phoneFilter || undefined);
      }, 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cancelar");
      setToCancel(null);
    } finally {
      setCancelling(false);
    }
  };

  const grouped = groupByDate(bookings);
  const sortedDates = [...grouped.keys()].sort();
  const today = toISODate(new Date());

  return (
    <div className="space-y-6">
      {/* Cancel modal */}
      {toCancel && (
        <CancelModal
          booking={toCancel}
          loading={cancelling}
          onConfirm={handleCancelConfirm}
          onCancel={() => setToCancel(null)}
        />
      )}

      {/* Success toast */}
      {successMsg && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl text-sm font-medium text-white flex items-center gap-2.5 shadow-2xl"
          style={{
            background: "rgba(30,120,60,0.95)",
            border: "0.5px solid rgba(60,180,90,0.4)",
            backdropFilter: "blur(8px)",
            animation: "toastIn 0.3s cubic-bezier(0.32,0.72,0,1) both",
          }}>
          <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(-8px) scale(0.95) } to { opacity:1; transform:none } }`}</style>
          <span>✓</span>
          {successMsg}
        </div>
      )}

      {/* Phone search */}
      <form onSubmit={handleSearch}>
        <div
          className="flex gap-2 p-1 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.09)",
          }}>
          <div className="flex-1 flex items-center gap-3 px-3">
            <span className="text-white/25 text-sm flex-shrink-0">📱</span>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Buscar por teléfono..."
              inputMode="tel"
              className="flex-1 bg-transparent text-white text-sm placeholder-white/20 focus:outline-none py-2"
            />
            {phoneInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-white/25 hover:text-white/60 transition-colors text-sm flex-shrink-0">
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.97] flex-shrink-0"
            style={{
              background: "rgba(196,80,31,0.25)",
              border: "0.5px solid rgba(196,80,31,0.4)",
            }}>
            Buscar
          </button>
        </div>
        {phoneFilter && (
          <p className="text-white/25 text-xs font-mono mt-2 pl-1">
            Mostrando turnos para: {phoneFilter}
          </p>
        )}
      </form>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm text-red-300 flex items-center gap-2"
          style={{
            background: "rgba(200,40,40,0.1)",
            border: "0.5px solid rgba(200,40,40,0.2)",
          }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: "rgba(200,90,30,0.2)",
              borderTopColor: "rgba(200,90,30,0.8)",
            }}
          />
          <p className="text-white/25 text-sm font-mono">Cargando turnos...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && bookings.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
            }}>
            📭
          </div>
          <div>
            <p className="text-white/60 font-semibold mb-1">
              Sin turnos activos
            </p>
            <p className="text-white/25 text-sm">
              {phoneFilter
                ? `No hay reservas para ese teléfono`
                : "No hay reservas pendientes"}
            </p>
          </div>
          {phoneFilter && (
            <button
              onClick={handleClearSearch}
              className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.09)",
              }}>
              Ver todos los turnos
            </button>
          )}
        </div>
      )}

      {/* Grouped booking cards */}
      {!loading &&
        sortedDates.map((date) => {
          const dayBookings = grouped.get(date) ?? [];
          const isToday = date === today;
          const isPast = date < today;

          return (
            <section key={date}>
              {/* Date group header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: isToday
                      ? "rgba(196,80,31,0.2)"
                      : "rgba(255,255,255,0.06)",
                    border: isToday
                      ? "0.5px solid rgba(196,80,31,0.4)"
                      : "0.5px solid rgba(255,255,255,0.09)",
                    color: isToday
                      ? "#fb923c"
                      : isPast
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(255,255,255,0.6)",
                  }}>
                  {capitalize(formatGroupDate(date))}
                </div>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <span className="text-white/20 text-xs font-mono">
                  {dayBookings.length} turno
                  {dayBookings.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Cards */}
              <div className="grid sm:grid-cols-2 gap-3">
                {dayBookings.map((b, i) => (
                  <div
                    key={b.id}
                    style={{
                      animation: `cardIn 0.35s ease-out ${i * 60}ms both`,
                    }}>
                    <style>{`@keyframes cardIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }`}</style>
                    <BookingCard
                      booking={b}
                      onCancel={setToCancel}
                      cancelled={cancelledIds.has(b.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}
