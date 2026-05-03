// app/admin/turnos/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { CancelModal } from "@/components/ui/CancelModal";
import { Booking } from "@/types";

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const COURT_NAMES: Record<string, string> = {
  "1": "Cancha 1",
  "2": "Cancha 2",
  "3": "Cancha 3",
  "4": "Cancha 4",
  "5": "Cancha 5",
  "6": "Cancha 6",
};

type Filter = "all" | "confirmed" | "cancelled";

export default function AdminTurnos() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancelConfirm = async () => {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: toCancel.id }),
      });
      setToCancel(null);
      load();
    } finally {
      setCancelling(false);
    }
  };

  const visible = bookings
    .filter((b) => filter === "all" || b.status === filter)
    .filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        b.court_id.includes(q) ||
        b.date.includes(q) ||
        b.players?.some(
          (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q),
        )
      );
    });

  return (
    <div className="space-y-4">
      {toCancel && (
        <CancelModal
          booking={toCancel}
          loading={cancelling}
          onConfirm={handleCancelConfirm}
          onCancel={() => setToCancel(null)}
        />
      )}

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          {(["all", "confirmed", "cancelled"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wide transition-all"
              style={{
                background:
                  filter === f ? "rgba(255,255,255,0.12)" : "transparent",
                color: filter === f ? "#fff" : "rgba(255,255,255,0.4)",
              }}>
              {f === "all"
                ? "Todos"
                : f === "confirmed"
                  ? "Activos"
                  : "Cancelados"}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar jugador, fecha, cancha..."
          className="flex-1 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}
        />
      </div>

      {/* Count */}
      <p className="text-white/30 text-xs font-mono">
        {visible.length} turno{visible.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-white/40">Sin turnos para mostrar</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "0.5px solid rgba(255,255,255,0.08)" }}>
          {/* Table header */}
          <div
            className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest font-mono"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.3)",
              borderBottom: "0.5px solid rgba(255,255,255,0.07)",
            }}>
            <div className="col-span-2">Cancha</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Horario</div>
            <div className="col-span-2">Jugador</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-1">Estado</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          <div
            className="divide-y"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {visible.map((b) => (
              <div
                key={b.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-white/[0.02] transition-colors">
                <div className="col-span-2 text-white/70 font-mono">
                  {COURT_NAMES[b.court_id] ?? `C${b.court_id}`}
                </div>
                <div className="col-span-2 text-white/60 text-xs">
                  {formatDate(b.date)}
                </div>
                <div className="col-span-2 text-white font-mono text-xs">
                  {b.time_start}–{b.time_end}
                </div>
                <div className="col-span-2 text-white/70 text-xs truncate">
                  {b.players?.[0]?.name ?? b.client_name ?? "—"}
                </div>
                <div className="col-span-2 text-white/40 text-xs capitalize">
                  {b.game_type}
                </div>
                <div className="col-span-1">
                  <span
                    className="text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={
                      b.status === "confirmed"
                        ? {
                            background: "rgba(34,197,94,0.12)",
                            color: "rgba(74,222,128,0.9)",
                          }
                        : {
                            background: "rgba(200,40,30,0.12)",
                            color: "rgba(240,100,80,0.8)",
                          }
                    }>
                    {b.status === "confirmed" ? "Activo" : "Cancelado"}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => setToCancel(b)}
                      className="text-[10px] px-2 py-1 rounded-lg transition-all hover:bg-red-900/30"
                      style={{
                        color: "rgba(240,100,80,0.7)",
                        border: "0.5px solid rgba(200,40,30,0.2)",
                      }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
