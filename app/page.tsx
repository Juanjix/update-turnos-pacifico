// app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { PacificoMap } from "@/components/PacificoMap";
import { BookingPanel } from "@/components/BookingPanel";
import { DatePicker } from "@/components/DatePicker";
// 🔧 MOCK MODE — swap this line for '@/lib/api-client' to use real API routes
import { getAvailability, seedBookings } from "@/lib/mockBackend";
import { Court, CourtAvailability } from "@/types";
import { MisTurnos } from "@/components/MisTurnos";
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    toISODate(new Date()),
  );
  const [courts, setCourts] = useState<CourtAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchAvailability = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAvailability(date);
      setCourts(data.courts);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al cargar disponibilidad",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Seed demo data once on first load so the map isn't empty
  useEffect(() => {
    seedBookings(toISODate(new Date()));
    fetchAvailability(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [selectedDate, fetchAvailability]);

  const handleCourtClick = (court: Court) => {
    setSelectedCourt(court);
    setPanelOpen(true);
  };

  const handlePanelClose = () => {
    setPanelOpen(false);
    setSelectedCourt(null);
  };

  const handleBooked = () => {
    // Re-fetch availability after booking
    fetchAvailability(selectedDate);
  };

  const selectedCourtAvailability =
    courts.find((c) => c.court.id === selectedCourt?.id) ?? null;

  return (
    <main
      className="min-h-screen text-white"
      style={{
        background:
          "linear-gradient(135deg, #060d0a 0%, #0a1a12 50%, #06100c 100%)",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}>
      <MisTurnos defaultPhone="" />

      {/* Header */}
      <header
        className="border-b border-white/5 px-4 md:px-6 py-3 md:py-4"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Tenis Pacífico Bahía Blanca"
              className="w-9 h-9 md:w-11 md:h-11 rounded-full object-cover ring-1 ring-white/10 shadow-lg"
            />
            <div>
              <div className="font-bold text-white tracking-tight text-sm">
                Club Pacífico Tenis
              </div>
              <div className="text-white/30 text-[10px] uppercase tracking-widest font-mono">
                Bahía Blanca · Reservas
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-400 text-[10px] uppercase tracking-widest">
              Mock
            </span>
            <div className="flex items-center gap-2 text-white/30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              En línea
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Date picker */}
        <section className="mb-6">
          <div className="text-xs uppercase tracking-widest text-white/30 font-mono mb-3">
            Seleccionar fecha
          </div>
          <DatePicker
            value={selectedDate}
            onChange={(d) => {
              setSelectedDate(d);
              setPanelOpen(false);
              setSelectedCourt(null);
            }}
          />
        </section>

        {/* Main layout */}
        <div className="flex gap-4">
          {/* Map area — shrinks when panel is open */}
          <div
            className="min-w-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ flex: panelOpen ? "1 1 0%" : "1 1 100%" }}>
            {loading ? (
              <div
                className="flex items-center justify-center rounded-2xl border border-white/10"
                style={{
                  aspectRatio: "16/9",
                  background: "rgba(255,255,255,0.02)",
                }}>
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-orange-500/40 border-t-orange-400 animate-spin mx-auto mb-3" />
                  <p className="text-white/30 text-sm font-mono">
                    Cargando disponibilidad...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div
                className="flex items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/20"
                style={{ aspectRatio: "16/9" }}>
                <div className="text-center">
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                  <button
                    onClick={() => fetchAvailability(selectedDate)}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/15 transition-colors">
                    Reintentar
                  </button>
                </div>
              </div>
            ) : (
              <PacificoMap
                courts={courts}
                selectedCourtId={selectedCourt?.id ?? null}
                onCourtClick={handleCourtClick}
              />
            )}

            {/* Stats row */}
            {!loading && !error && courts.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Canchas disponibles",
                    value: courts.filter((c) =>
                      c.slots.some((s) => s.available),
                    ).length,
                    of: courts.length,
                  },
                  {
                    label: "Turnos libres",
                    value: courts.reduce(
                      (acc, c) =>
                        acc + c.slots.filter((s) => s.available).length,
                      0,
                    ),
                    of: courts.reduce((acc, c) => acc + c.slots.length, 0),
                  },
                  {
                    label: "Reservas confirmadas",
                    value: courts.reduce(
                      (acc, c) =>
                        acc + c.slots.filter((s) => !s.available).length,
                      0,
                    ),
                    of: null,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl px-4 py-3"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "0.5px solid rgba(255,255,255,0.08)",
                    }}>
                    <div className="hidden sm:block text-[10px] uppercase tracking-widest text-white/30 font-mono mb-1">
                      {stat.label}
                    </div>
                    <div className="text-white font-bold text-2xl">
                      {stat.value}
                      {stat.of !== null && (
                        <span className="text-white/30 text-base font-normal">
                          /{stat.of}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hint */}
            {!panelOpen && !loading && !error && (
              <p className="text-center text-white/20 text-xs mt-5 font-mono tracking-widest uppercase">
                Seleccioná una cancha para reservar
              </p>
            )}
          </div>

          {/* Booking panel — slides in from right */}
          <div
            className="flex-shrink-0 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              width: panelOpen && selectedCourtAvailability ? 320 : 0,
              opacity: panelOpen && selectedCourtAvailability ? 1 : 0,
            }}>
            {/* Only mount content when there's something to show — prevents ghost box */}
            {selectedCourtAvailability && !isMobile && (
              <div
                className="w-80 rounded-2xl overflow-hidden flex flex-col"
                style={{
                  minHeight: 480,
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                }}>
                <BookingPanel
                  courtAvailability={selectedCourtAvailability}
                  selectedDate={selectedDate}
                  onClose={handlePanelClose}
                  onBooked={handleBooked}
                  isMobile={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet — rendered outside normal flow */}
      {isMobile && panelOpen && selectedCourtAvailability && (
        <BookingPanel
          courtAvailability={selectedCourtAvailability}
          selectedDate={selectedDate}
          onClose={handlePanelClose}
          onBooked={handleBooked}
          isMobile={true}
        />
      )}
    </main>
  );
}
