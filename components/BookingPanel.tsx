// components/BookingPanel.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { CourtAvailability, TimeSlot } from "@/types";
// 🔧 MOCK MODE — swap this line for '@/lib/api-client' to use real API routes
import { createBooking } from "@/lib/mockBackend";

interface BookingPanelProps {
  courtAvailability: CourtAvailability | null;
  selectedDate: string;
  onClose: () => void;
  onBooked: () => void;
  /** On mobile, rendered as a bottom sheet instead of side panel */
  isMobile?: boolean;
}

type PanelStep = "slots" | "form" | "success";

export function BookingPanel({
  courtAvailability,
  selectedDate,
  onClose,
  onBooked,
  isMobile,
}: BookingPanelProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [step, setStep] = useState<PanelStep>("slots");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Animate in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Focus name field when form appears
  useEffect(() => {
    if (step === "form") setTimeout(() => nameRef.current?.focus(), 150);
  }, [step]);

  if (!courtAvailability) return null;

  const { court, slots } = courtAvailability;
  const isIndoor = court.type === "indoor";
  const courtShortName = court.name.replace(/\s*\(.*\)/, ""); // strip "(Cubierta)" etc.

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setStep("form");
    setError(null);
  };

  const handleBack = () => {
    setStep("slots");
    setSelectedSlot(null);
    setError(null);
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !name.trim() || !phone.trim()) {
      setError("Completá nombre y teléfono");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createBooking({
        courtId: court.id,
        date: selectedDate,
        timeStart: selectedSlot.time_start,
        timeEnd: selectedSlot.time_end,
        name,
        phone,
      });
      setStep("success");
      onBooked();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al reservar");
    } finally {
      setLoading(false);
    }
  };

  const accentBg = "bg-orange-500";
  const accentHover = "hover:bg-orange-400";
  const accentText = "text-orange-400";
  const accentBorder = "border-orange-500/40";

  // ── MOBILE: bottom sheet ────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={handleClose}
          className="fixed inset-0 z-40 transition-all duration-300"
          style={{
            background: visible ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0)",
            backdropFilter: visible ? "blur(4px)" : "none",
          }}
        />

        {/* Sheet */}
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #111a12 0%, #0d1510 100%)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderBottom: "none",
            maxHeight: "90dvh",
            transform: visible ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1)",
          }}>
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-xl tracking-tight">
                  {courtShortName}
                </h2>
                <span
                  className={`text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full ${accentText} bg-orange-500/10`}>
                  {isIndoor ? "Cubierta" : "Exterior"}
                </span>
              </div>
              <p className="text-white/35 text-xs font-mono tracking-widest mt-0.5 uppercase">
                {formatDisplayDate(selectedDate)}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/8 text-white/50 active:bg-white/15 transition-colors">
              ✕
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/8 flex-shrink-0" />

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <SheetBody
              step={step}
              slots={slots}
              selectedSlot={selectedSlot}
              court={court}
              courtShortName={courtShortName}
              selectedDate={selectedDate}
              name={name}
              phone={phone}
              error={error}
              nameRef={nameRef}
              onSlotSelect={handleSlotSelect}
              onNameChange={setName}
              onPhoneChange={setPhone}
              onClose={handleClose}
              accentText={accentText}
              accentBorder={accentBorder}
            />
          </div>

          {/* Footer CTA — pinned above keyboard */}
          {step === "form" && (
            <div
              className="flex-shrink-0 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-white/8 space-y-2"
              style={{ background: "rgba(0,0,0,0.3)" }}>
              <button
                onClick={handleSubmit}
                disabled={loading || !name.trim() || !phone.trim()}
                className={`w-full py-4 rounded-2xl font-semibold text-base tracking-wide text-white transition-all active:scale-[0.98] disabled:opacity-40 ${accentBg} ${accentHover}`}>
                {loading ? "Reservando..." : "Confirmar reserva"}
              </button>
              <button
                onClick={handleBack}
                className="w-full py-3 rounded-2xl text-white/50 text-sm active:text-white transition-colors">
                Cambiar horario
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── DESKTOP: side panel (unchanged behaviour) ───────────────────────────────
  return (
    <div
      className="flex flex-col h-full transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateX(8px)",
      }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-white/10"
        style={{
          background:
            "linear-gradient(90deg, rgba(180,80,30,0.15) 0%, transparent 100%)",
        }}>
        <div>
          <h2 className="text-white font-bold text-lg tracking-tight">
            {courtShortName}
          </h2>
          <span
            className={`text-xs uppercase tracking-widest font-mono ${accentText}`}>
            {isIndoor ? "Cubierta" : "Exterior"} ·{" "}
            {formatDisplayDate(selectedDate)}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        <SheetBody
          step={step}
          slots={slots}
          selectedSlot={selectedSlot}
          court={court}
          courtShortName={courtShortName}
          selectedDate={selectedDate}
          name={name}
          phone={phone}
          error={error}
          nameRef={nameRef}
          onSlotSelect={handleSlotSelect}
          onNameChange={setName}
          onPhoneChange={setPhone}
          onClose={handleClose}
          accentText={accentText}
          accentBorder={accentBorder}
        />
      </div>

      {/* Footer */}
      {step === "form" && (
        <div className="px-5 pb-5 pt-3 border-t border-white/10 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !phone.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-sm tracking-wide text-white transition-all active:scale-[0.98] disabled:opacity-40 ${accentBg} ${accentHover}`}>
            {loading ? "Reservando..." : "Confirmar reserva"}
          </button>
          <button
            onClick={handleBack}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 text-sm transition-colors">
            Cambiar horario
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared body content ──────────────────────────────────────────────────────
function SheetBody({
  step,
  slots,
  selectedSlot,
  court,
  courtShortName,
  selectedDate,
  name,
  phone,
  error,
  nameRef,
  onSlotSelect,
  onNameChange,
  onPhoneChange,
  onClose,
  accentText,
  accentBorder,
}: {
  step: PanelStep;
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  court: CourtAvailability["court"];
  courtShortName: string;
  selectedDate: string;
  name: string;
  phone: string;
  error: string | null;
  nameRef: React.RefObject<HTMLInputElement>;
  onSlotSelect: (s: TimeSlot) => void;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onClose: () => void;
  accentText: string;
  accentBorder: string;
}) {
  if (step === "slots") {
    const available = slots.filter((s) => s.available);
    const occupied = slots.filter((s) => !s.available);

    if (available.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">🎾</div>
          <p className="text-white font-semibold mb-1">
            Sin turnos disponibles
          </p>
          <p className="text-white/40 text-sm">Probá con otra fecha o cancha</p>
        </div>
      );
    }

    return (
      <div className="px-5 py-4">
        <p className="text-white/35 text-[11px] uppercase tracking-widest font-mono mb-3">
          {available.length} turno{available.length !== 1 ? "s" : ""} disponible
          {available.length !== 1 ? "s" : ""}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot, i) => {
            const isBooked = !slot.available && !slot.past && !!slot.booking;
            const label = slot.past ? "pasado" : isBooked ? "ocupado" : "libre";
            return (
              <button
                key={slot.time_start}
                onClick={() => onSlotSelect(slot)}
                disabled={!slot.available}
                className="relative flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border transition-all duration-150"
                style={{
                  animation: slot.available
                    ? `slotIn 0.3s ease-out ${i * 30}ms both`
                    : "none",
                  background: slot.past
                    ? "rgba(255,255,255,0.01)"
                    : isBooked
                      ? "rgba(180,40,40,0.08)"
                      : slot.available
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.02)",
                  borderColor: slot.past
                    ? "rgba(255,255,255,0.03)"
                    : isBooked
                      ? "rgba(220,60,60,0.2)"
                      : slot.available
                        ? "rgba(255,255,255,0.14)"
                        : "rgba(255,255,255,0.05)",
                  opacity: slot.past ? 0.22 : 1,
                  cursor: slot.available ? "pointer" : "not-allowed",
                }}>
                <span
                  className="text-sm font-mono font-semibold"
                  style={{
                    color: slot.past
                      ? "rgba(255,255,255,0.18)"
                      : isBooked
                        ? "rgba(240,100,100,0.6)"
                        : "rgba(255,255,255,0.95)",
                    textDecoration: slot.past ? "line-through" : "none",
                  }}>
                  {slot.time_start}
                </span>
                <span
                  className="text-[9px] font-mono uppercase tracking-wide mt-0.5"
                  style={{
                    color: slot.past
                      ? "rgba(255,255,255,0.1)"
                      : isBooked
                        ? "rgba(240,100,100,0.45)"
                        : "rgba(255,255,255,0.3)",
                  }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === "form" && selectedSlot) {
    return (
      <div className="px-5 py-4 space-y-5">
        {/* Slot recap */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}>
          <div className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-2">
            Turno seleccionado
          </div>
          <div className="text-white font-bold text-3xl font-mono tracking-tight">
            {selectedSlot.time_start}
            <span className="text-white/30 text-xl mx-2">–</span>
            {selectedSlot.time_end}
          </div>
          <div className="text-white/40 text-sm mt-1">
            {courtShortName} · {formatDisplayDate(selectedDate)}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-white/35 font-mono mb-2">
              Nombre
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Juan García"
              autoComplete="name"
              className="w-full rounded-xl px-4 py-3.5 text-white text-base placeholder-white/20 focus:outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.12)",
              }}
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-white/35 font-mono mb-2">
              WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+54 9 11 1234-5678"
              autoComplete="tel"
              inputMode="tel"
              className="w-full rounded-xl px-4 py-3.5 text-white text-base placeholder-white/20 focus:outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.12)",
              }}
            />
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-950/60 border border-red-500/25 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (step === "success" && selectedSlot) {
    return (
      <div className="px-5 py-8 flex flex-col items-center text-center">
        {/* Success ring */}
        <div className="relative mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "0.5px solid rgba(255,255,255,0.12)",
            }}>
            ✓
          </div>
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "rgba(200,100,40,0.4)" }}
          />
        </div>

        <h3 className="text-white font-bold text-2xl mb-1">¡Reservado!</h3>
        <p className="text-white/40 text-sm mb-8">
          {courtShortName} · {selectedSlot.time_start}–{selectedSlot.time_end}
        </p>

        <div
          className="w-full rounded-2xl p-4 text-left space-y-2 mb-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}>
          {[
            { label: "Cancha", value: court.name },
            { label: "Fecha", value: formatDisplayDate(selectedDate) },
            {
              label: "Horario",
              value: `${selectedSlot.time_start} – ${selectedSlot.time_end}`,
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-baseline">
              <span className="text-white/30 text-xs font-mono uppercase tracking-widest">
                {label}
              </span>
              <span className="text-white text-sm">{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl text-white font-medium transition-all active:scale-[0.98]"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}>
          Volver
        </button>
      </div>
    );
  }

  return null;
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
