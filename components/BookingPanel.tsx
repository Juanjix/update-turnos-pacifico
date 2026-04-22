// components/BookingPanel.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { CourtAvailability, TimeSlot, GameType, Player } from "@/types";
// 🔧 MOCK MODE — swap this line for '@/lib/api-client' to use real API routes
import { createBooking } from "@/lib/mockBackend";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingPanelProps {
  courtAvailability: CourtAvailability | null;
  selectedDate: string;
  onClose: () => void;
  onBooked: () => void;
  isMobile?: boolean;
}

type PanelStep = "slots" | "form" | "success";
type MemberStatus = "member" | "non-member" | null;

const PLAYER_COUNT: Record<GameType, number> = { singles: 2, doubles: 4 };

function emptyPlayers(count: number): Player[] {
  return Array.from({ length: count }, () => ({ name: "", phone: "" }));
}

// ─── Non-member warning modal ─────────────────────────────────────────────────

function NonMemberModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
        style={{
          background: "linear-gradient(160deg, #1a1410 0%, #130f0c 100%)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          animation: "modalIn 0.25s cubic-bezier(0.32,0.72,0,1) both",
        }}>
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(8px) } to { opacity:1; transform:none } }`}</style>

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto"
          style={{
            background: "rgba(230,160,30,0.12)",
            border: "0.5px solid rgba(230,160,30,0.2)",
          }}>
          ⚠
        </div>

        {/* Copy */}
        <div className="text-center">
          <h3 className="text-white font-bold text-lg mb-2">
            Ingreso como transeúnte
          </h3>
          <p className="text-white/55 text-sm leading-relaxed">
            Al ingresar al club se te solicitará abonar un{" "}
            <span className="text-amber-300 font-medium">
              valor adicional por transeúnte
            </span>
            . Podés consultar el monto en recepción.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #c4501f 0%, #a03a15 100%)",
            }}>
            Entendido, continuar
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-2xl text-white/40 text-sm hover:text-white/70 transition-colors">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BookingPanel({
  courtAvailability,
  selectedDate,
  onClose,
  onBooked,
  isMobile,
}: BookingPanelProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [step, setStep] = useState<PanelStep>("slots");
  const [gameType, setGameType] = useState<GameType>("singles");
  const [players, setPlayers] = useState<Player[]>(emptyPlayers(2));
  const [memberStatus, setMemberStatus] = useState<MemberStatus>(null);
  const [showNonMemberModal, setShowNonMemberModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (step === "form") setTimeout(() => firstInputRef.current?.focus(), 200);
  }, [step]);

  if (!courtAvailability) return null;
  const { court, slots } = courtAvailability;
  const shortName = court.name.replace(/\s*\(.*\)/, "");
  const isIndoor = court.type === "indoor";

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleGameTypeChange = (gt: GameType) => {
    setGameType(gt);
    setPlayers(emptyPlayers(PLAYER_COUNT[gt]));
    setError(null);
  };

  const updatePlayer = (idx: number, field: keyof Player, value: string) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
    setError(null);
  };

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

  const isFormComplete = () =>
    memberStatus !== null &&
    players.every((p) => p.name.trim() && p.phone.trim());

  const handleSubmitAttempt = () => {
    if (!isFormComplete()) {
      setError("Completá todos los campos antes de continuar");
      return;
    }
    if (memberStatus === "non-member") {
      setShowNonMemberModal(true);
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    setError(null);
    try {
      await createBooking({
        courtId: court.id,
        date: selectedDate,
        timeStart: selectedSlot.time_start,
        timeEnd: selectedSlot.time_end,
        name: players[0].name,
        phone: players[0].phone,
        gameType,
        players,
        isMember: memberStatus === "member",
      });
      setStep("success");
      onBooked();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al reservar");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const content = (
    <>
      {/* Non-member modal */}
      {showNonMemberModal && (
        <NonMemberModal
          onConfirm={() => {
            setShowNonMemberModal(false);
            doSubmit();
          }}
          onCancel={() => setShowNonMemberModal(false)}
        />
      )}

      {step === "slots" && (
        <SlotPicker slots={slots} onSelect={handleSlotSelect} />
      )}

      {step === "form" && selectedSlot && (
        <BookingForm
          slot={selectedSlot}
          court={{ ...court, name: shortName }}
          selectedDate={selectedDate}
          gameType={gameType}
          players={players}
          memberStatus={memberStatus}
          error={error}
          firstInputRef={firstInputRef}
          onGameTypeChange={handleGameTypeChange}
          onUpdatePlayer={updatePlayer}
          onMemberStatusChange={setMemberStatus}
        />
      )}

      {step === "success" && selectedSlot && (
        <SuccessView
          slot={selectedSlot}
          court={{ ...court, name: shortName }}
          selectedDate={selectedDate}
          players={players}
          gameType={gameType}
          isMember={memberStatus === "member"}
          onClose={handleClose}
        />
      )}
    </>
  );

  const footer = step === "form" && (
    <div
      className="flex-shrink-0 px-5 pt-3 space-y-2"
      style={{
        paddingBottom: isMobile
          ? "max(1.25rem, env(safe-area-inset-bottom))"
          : "1.25rem",
        borderTop: "0.5px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.25)",
      }}>
      {error && (
        <div
          className="px-4 py-2.5 rounded-xl text-sm text-red-300"
          style={{
            background: "rgba(200,40,40,0.12)",
            border: "0.5px solid rgba(200,40,40,0.2)",
          }}>
          {error}
        </div>
      )}
      <button
        onClick={handleSubmitAttempt}
        disabled={loading || !isFormComplete()}
        className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all active:scale-[0.98] disabled:opacity-35"
        style={{
          background: "linear-gradient(135deg, #c4501f 0%, #a03a15 100%)",
        }}>
        {loading ? "Reservando..." : "Confirmar reserva"}
      </button>
      <button
        onClick={handleBack}
        className="w-full py-3 rounded-2xl text-white/35 text-sm hover:text-white/60 transition-colors">
        Cambiar horario
      </button>
    </div>
  );

  // ── Mobile: bottom sheet ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div
          onClick={handleClose}
          className="fixed inset-0 z-40 transition-all duration-300"
          style={{
            background: visible ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0)",
            backdropFilter: visible ? "blur(4px)" : "none",
          }}
        />

        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #111a12 0%, #0d1510 100%)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderBottom: "none",
            maxHeight: "92dvh",
            transform: visible ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1)",
          }}>
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          <SheetHeader
            shortName={shortName}
            isIndoor={isIndoor}
            selectedDate={selectedDate}
            step={step}
            onClose={handleClose}
          />
          <div className="h-px bg-white/8 flex-shrink-0" />
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {content}
          </div>
          {footer}
        </div>
      </>
    );
  }

  // ── Desktop: side panel ───────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-full transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateX(8px)",
      }}>
      <SheetHeader
        shortName={shortName}
        isIndoor={isIndoor}
        selectedDate={selectedDate}
        step={step}
        onClose={handleClose}
      />
      <div className="flex-1 overflow-y-auto">{content}</div>
      {footer}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function SheetHeader({
  shortName,
  isIndoor,
  selectedDate,
  step,
  onClose,
}: {
  shortName: string;
  isIndoor: boolean;
  selectedDate: string;
  step: PanelStep;
  onClose: () => void;
}) {
  const stepLabel =
    step === "slots"
      ? "Elegí un horario"
      : step === "form"
        ? "Datos del turno"
        : null;
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
      style={{
        background:
          "linear-gradient(90deg, rgba(180,70,20,0.12) 0%, transparent 100%)",
      }}>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-white font-bold text-xl tracking-tight">
            {shortName}
          </h2>
          <span
            className="text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full text-orange-400"
            style={{
              background: "rgba(200,90,30,0.12)",
              border: "0.5px solid rgba(200,90,30,0.2)",
            }}>
            {isIndoor ? "Cubierta" : "Exterior"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-white/30 text-xs font-mono tracking-widest uppercase">
            {formatDisplayDate(selectedDate)}
          </p>
          {stepLabel && <span className="text-white/20 text-xs">·</span>}
          {stepLabel && (
            <p className="text-white/30 text-xs font-mono">{stepLabel}</p>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
        style={{ background: "rgba(255,255,255,0.06)" }}>
        ✕
      </button>
    </div>
  );
}

// ─── Slot picker ──────────────────────────────────────────────────────────────

function SlotPicker({
  slots,
  onSelect,
}: {
  slots: TimeSlot[];
  onSelect: (s: TimeSlot) => void;
}) {
  const available = slots.filter((s) => s.available);
  if (available.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-5">
        <div className="text-5xl mb-4">🎾</div>
        <p className="text-white font-semibold mb-1">Sin turnos disponibles</p>
        <p className="text-white/40 text-sm">Probá con otra fecha o cancha</p>
      </div>
    );
  }
  return (
    <div className="px-5 py-4">
      <style>{`@keyframes slotIn { from { opacity:0; transform:scale(0.88) } to { opacity:1; transform:scale(1) } }`}</style>
      <p className="text-white/30 text-[11px] uppercase tracking-widest font-mono mb-3">
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
              onClick={() => onSelect(slot)}
              disabled={!slot.available}
              className="flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border transition-all duration-150"
              style={{
                animation: slot.available
                  ? `slotIn 0.3s ease-out ${i * 25}ms both`
                  : "none",
                background: slot.past
                  ? "rgba(255,255,255,0.01)"
                  : isBooked
                    ? "rgba(180,40,40,0.08)"
                    : "rgba(255,255,255,0.06)",
                borderColor: slot.past
                  ? "rgba(255,255,255,0.03)"
                  : isBooked
                    ? "rgba(220,60,60,0.2)"
                    : "rgba(255,255,255,0.14)",
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

// ─── Booking form ─────────────────────────────────────────────────────────────

function BookingForm({
  slot,
  court,
  selectedDate,
  gameType,
  players,
  memberStatus,
  error,
  firstInputRef,
  onGameTypeChange,
  onUpdatePlayer,
  onMemberStatusChange,
}: {
  slot: TimeSlot;
  court: { name: string; type: string };
  selectedDate: string;
  gameType: GameType;
  players: Player[];
  memberStatus: MemberStatus;
  error: string | null;
  firstInputRef: React.RefObject<HTMLInputElement>;
  onGameTypeChange: (gt: GameType) => void;
  onUpdatePlayer: (idx: number, field: keyof Player, value: string) => void;
  onMemberStatusChange: (s: MemberStatus) => void;
}) {
  return (
    <div className="px-5 py-4 space-y-5">
      {/* Slot recap */}
      <div
        className="rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.08)",
        }}>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/25 font-mono mb-0.5">
            Turno
          </div>
          <div className="text-white font-bold text-2xl font-mono">
            {slot.time_start}
            <span className="text-white/25 text-lg mx-1.5">–</span>
            {slot.time_end}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/25 font-mono mb-0.5">
            Fecha
          </div>
          <div className="text-white/70 text-sm">
            {formatDisplayDate(selectedDate)}
          </div>
        </div>
      </div>

      {/* Game type */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest text-white/35 font-mono mb-2.5">
          Tipo de juego
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["singles", "doubles"] as GameType[]).map((gt) => (
            <button
              key={gt}
              onClick={() => onGameTypeChange(gt)}
              className="py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{
                background:
                  gameType === gt
                    ? "linear-gradient(135deg,#c4501f,#a03a15)"
                    : "rgba(255,255,255,0.05)",
                border: `0.5px solid ${gameType === gt ? "rgba(200,90,30,0.5)" : "rgba(255,255,255,0.09)"}`,
                color: gameType === gt ? "#fff" : "rgba(255,255,255,0.5)",
                boxShadow:
                  gameType === gt ? "0 4px 16px rgba(180,60,20,0.3)" : "none",
              }}>
              {gt === "singles" ? "1 vs 1 · Singles" : "2 vs 2 · Dobles"}
            </button>
          ))}
        </div>
        <p className="text-white/25 text-[11px] font-mono mt-1.5 pl-1">
          {PLAYER_COUNT[gameType]} jugadores requeridos
        </p>
      </div>

      {/* Players */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest text-white/35 font-mono mb-2.5">
          Jugadores
        </label>
        <div className="space-y-3">
          {players.map((player, idx) => (
            <PlayerRow
              key={idx}
              idx={idx}
              player={player}
              inputRef={idx === 0 ? firstInputRef : undefined}
              onChange={onUpdatePlayer}
            />
          ))}
        </div>
      </div>

      {/* Member status */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest text-white/35 font-mono mb-2.5">
          Condición
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["member", "Socio"],
              ["non-member", "No socio"],
            ] as [MemberStatus, string][]
          ).map(([val, label]) => (
            <button
              key={val!}
              onClick={() => onMemberStatusChange(val)}
              className="py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{
                background:
                  memberStatus === val
                    ? val === "member"
                      ? "rgba(30,160,80,0.18)"
                      : "rgba(200,140,20,0.15)"
                    : "rgba(255,255,255,0.05)",
                border: `0.5px solid ${
                  memberStatus === val
                    ? val === "member"
                      ? "rgba(40,180,90,0.35)"
                      : "rgba(220,160,20,0.3)"
                    : "rgba(255,255,255,0.09)"
                }`,
                color:
                  memberStatus === val
                    ? val === "member"
                      ? "rgba(100,220,140,0.95)"
                      : "rgba(240,185,60,0.95)"
                    : "rgba(255,255,255,0.5)",
              }}>
              {label}
            </button>
          ))}
        </div>
        {memberStatus === "non-member" && (
          <p className="text-amber-400/70 text-[11px] font-mono mt-2 pl-1 leading-relaxed">
            Se cobrará un adicional por transeúnte al ingresar
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Player row ───────────────────────────────────────────────────────────────

function PlayerRow({
  idx,
  player,
  inputRef,
  onChange,
}: {
  idx: number;
  player: Player;
  inputRef?: React.RefObject<HTMLInputElement>;
  onChange: (idx: number, field: keyof Player, value: string) => void;
}) {
  const labels = ["Vos", "Oponente", "Jugador 3", "Jugador 4"];
  return (
    <div
      className="rounded-2xl p-3 space-y-2"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.07)",
      }}>
      <div className="text-[10px] uppercase tracking-widest text-white/25 font-mono pl-1">
        {labels[idx]}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Nombre"
          value={player.name}
          autoComplete={idx === 0 ? "name" : "off"}
          onChange={(e) => onChange(idx, "name", e.target.value)}
          className="rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none w-full transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={player.phone}
          inputMode="tel"
          autoComplete={idx === 0 ? "tel" : "off"}
          onChange={(e) => onChange(idx, "phone", e.target.value)}
          className="rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none w-full transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Success view ─────────────────────────────────────────────────────────────

function SuccessView({
  slot,
  court,
  selectedDate,
  players,
  gameType,
  isMember,
  onClose,
}: {
  slot: TimeSlot;
  court: { name: string };
  selectedDate: string;
  players: Player[];
  gameType: GameType;
  isMember: boolean;
  onClose: () => void;
}) {
  return (
    <div className="px-5 py-8 flex flex-col items-center text-center">
      <div className="relative mb-5">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            fontSize: 32,
          }}>
          ✓
        </div>
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-15"
          style={{ background: "rgba(200,100,40,0.5)" }}
        />
      </div>

      <h3 className="text-white font-bold text-2xl mb-1">¡Reservado!</h3>
      <p className="text-white/35 text-sm mb-6">
        {court.name} · {slot.time_start}–{slot.time_end}
      </p>

      {/* Summary card */}
      <div
        className="w-full rounded-2xl p-4 text-left mb-5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.08)",
        }}>
        <div className="space-y-2.5">
          {[
            { label: "Fecha", value: formatDisplayDate(selectedDate) },
            {
              label: "Horario",
              value: `${slot.time_start} – ${slot.time_end}`,
            },
            {
              label: "Modalidad",
              value: gameType === "singles" ? "Singles" : "Dobles",
            },
            { label: "Condición", value: isMember ? "Socio" : "No socio" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-baseline">
              <span className="text-white/25 text-xs font-mono uppercase tracking-widest">
                {label}
              </span>
              <span className="text-white/80 text-sm">{value}</span>
            </div>
          ))}
        </div>

        {/* Players list */}
        <div
          className="mt-3 pt-3"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
          <div className="text-white/25 text-[10px] font-mono uppercase tracking-widest mb-2">
            Jugadores
          </div>
          <div className="space-y-1">
            {players.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-white/60 text-sm">{p.name}</span>
                <span className="text-white/30 text-xs font-mono">
                  {p.phone}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-2xl text-white font-medium transition-all active:scale-[0.98] text-sm"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "0.5px solid rgba(255,255,255,0.1)",
        }}>
        Volver
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
