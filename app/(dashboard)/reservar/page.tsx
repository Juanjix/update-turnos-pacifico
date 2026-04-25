// app/(dashboard)/reservar/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { PacificoMap } from "@/components/PacificoMap";
import { BookingPanel } from "@/components/BookingPanel";
import { DatePicker } from "@/components/DatePicker";
import { getAvailability } from "@/lib/api-client";
import { Court, CourtAvailability } from "@/types";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReservarPage() {
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
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
    fetchAvailability(selectedDate);
  };

  const selectedCourtAvailability =
    courts.find((c) => c.court.id === selectedCourt?.id) ?? null;

  return (
    <div className="space-y-5">
      {/* Date picker */}
      <section>
        <p className="text-white/25 text-[10px] uppercase tracking-widest font-mono mb-3">
          Seleccionar fecha
        </p>
        <DatePicker
          value={selectedDate}
          onChange={(d) => {
            setSelectedDate(d);
            setPanelOpen(false);
            setSelectedCourt(null);
          }}
        />
      </section>

      {/* Map + panel */}
      <div className="flex gap-4">
        {/* Map */}
        <div
          className="min-w-0 transition-all duration-500"
          style={{
            flex: panelOpen ? "1 1 0%" : "1 1 100%",
            transition: "flex 0.45s cubic-bezier(0.32,0.72,0,1)",
          }}>
          {loading ? (
            <div
              className="flex items-center justify-center rounded-2xl border"
              style={{
                aspectRatio: "16/9",
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.08)",
              }}>
              <div className="text-center">
                <div
                  className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3"
                  style={{
                    borderColor: "rgba(200,90,30,0.3)",
                    borderTopColor: "rgba(200,90,30,0.9)",
                  }}
                />
                <p className="text-white/25 text-sm font-mono">
                  Cargando disponibilidad...
                </p>
              </div>
            </div>
          ) : error ? (
            <div
              className="flex items-center justify-center rounded-2xl border"
              style={{
                aspectRatio: "16/9",
                background: "rgba(180,30,20,0.08)",
                borderColor: "rgba(200,40,30,0.2)",
              }}>
              <div className="text-center">
                <p className="text-red-400 text-sm mb-3">{error}</p>
                <button
                  onClick={() => fetchAvailability(selectedDate)}
                  className="px-4 py-2 rounded-xl text-white/60 text-sm hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
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

          {/* Stats */}
          {!loading && !error && courts.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                {
                  label: "Canchas disponibles",
                  value: courts.filter((c) => c.slots.some((s) => s.available))
                    .length,
                  of: courts.length,
                },
                {
                  label: "Turnos libres",
                  value: courts.reduce(
                    (a, c) => a + c.slots.filter((s) => s.available).length,
                    0,
                  ),
                  of: courts.reduce((a, c) => a + c.slots.length, 0),
                },
                {
                  label: "Reservas hoy",
                  value: courts.reduce(
                    (a, c) =>
                      a + c.slots.filter((s) => !s.available && !s.past).length,
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
                    border: "0.5px solid rgba(255,255,255,0.07)",
                  }}>
                  <div
                    className="text-[9px] uppercase tracking-widest font-mono mb-1 hidden sm:block"
                    style={{ color: "rgba(255,255,255,0.2)" }}>
                    {stat.label}
                  </div>
                  <div className="text-white font-bold text-2xl">
                    {stat.value}
                    {stat.of !== null && (
                      <span className="text-white/25 text-base font-normal">
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
            <p className="text-center text-white/15 text-xs mt-4 font-mono tracking-widest uppercase">
              Seleccioná una cancha para reservar
            </p>
          )}
        </div>

        {/* Desktop side panel */}
        <div
          className="flex-shrink-0 overflow-hidden transition-all duration-500"
          style={{
            width:
              panelOpen && selectedCourtAvailability && !isMobile ? 320 : 0,
            opacity:
              panelOpen && selectedCourtAvailability && !isMobile ? 1 : 0,
            transition:
              "width 0.45s cubic-bezier(0.32,0.72,0,1), opacity 0.3s ease",
          }}>
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

      {/* Mobile bottom sheet */}
      {isMobile && panelOpen && selectedCourtAvailability && (
        <BookingPanel
          courtAvailability={selectedCourtAvailability}
          selectedDate={selectedDate}
          onClose={handlePanelClose}
          onBooked={handleBooked}
          isMobile
        />
      )}
    </div>
  );
}
