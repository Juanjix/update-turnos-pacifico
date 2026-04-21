// components/PacificoMap.tsx
"use client";

import { Court, CourtAvailability } from "@/types";

// Absolute positions on the map background (percentage-based)
const COURT_POSITIONS: Record<string, { x: number; y: number }> = {
  "1": { x: 18, y: 30 },
  "2": { x: 18, y: 65 },
  "3": { x: 50, y: 30 },
  "4": { x: 50, y: 65 },
  "5": { x: 82, y: 30 },
  "6": { x: 82, y: 65 },
};

interface PacificoMapProps {
  courts: CourtAvailability[];
  selectedCourtId: string | null;
  onCourtClick: (court: Court) => void;
}

type CourtStatus = "available" | "limited" | "full";

function getStatus(ca: CourtAvailability): CourtStatus {
  const available = ca.slots.filter((s) => s.available).length;
  if (available === 0) return "full";
  if (available <= 3) return "limited";
  return "available";
}

// ─── Mini tennis court drawn in SVG ──────────────────────────────────────────
function TennisCourtSVG({
  isIndoor,
  status,
  isSelected,
}: {
  isIndoor: boolean;
  status: CourtStatus;
  isSelected: boolean;
}) {
  const surface =
    status === "full"
      ? isIndoor
        ? "#7a3218"
        : "#8a3a1a"
      : isIndoor
        ? "#b84a20"
        : "#d4602a";

  const lineColor = "rgba(255,255,255,0.82)";
  const netColor = "rgba(255,255,255,0.90)";

  return (
    <svg
      viewBox="0 0 120 78"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ display: "block" }}>
      {/* Surface */}
      <rect x="0" y="0" width="120" height="78" rx="3" fill={surface} />

      {/* Outer boundary */}
      <rect
        x="8"
        y="8"
        width="104"
        height="62"
        fill="none"
        stroke={lineColor}
        strokeWidth="1.2"
      />

      {/* Service boxes */}
      <line
        x1="8"
        y1="28"
        x2="112"
        y2="28"
        stroke={lineColor}
        strokeWidth="0.8"
      />
      <line
        x1="8"
        y1="50"
        x2="112"
        y2="50"
        stroke={lineColor}
        strokeWidth="0.8"
      />

      {/* Center service line */}
      <line
        x1="60"
        y1="28"
        x2="60"
        y2="50"
        stroke={lineColor}
        strokeWidth="0.8"
      />

      {/* Net (dashed vertical) */}
      <line
        x1="60"
        y1="8"
        x2="60"
        y2="70"
        stroke={netColor}
        strokeWidth="2"
        strokeDasharray="2,2"
        opacity="0.9"
      />

      {/* Net posts */}
      <circle cx="60" cy="8" r="2" fill={netColor} opacity="0.9" />
      <circle cx="60" cy="70" r="2" fill={netColor} opacity="0.9" />

      {/* Occupied tint */}
      {status === "full" && (
        <rect
          x="0"
          y="0"
          width="120"
          height="78"
          rx="3"
          fill="rgba(180,30,30,0.2)"
        />
      )}

      {/* Selected highlight */}
      {isSelected && (
        <rect
          x="0"
          y="0"
          width="120"
          height="78"
          rx="3"
          fill="rgba(255,255,255,0.06)"
        />
      )}
    </svg>
  );
}

// ─── Single court button ──────────────────────────────────────────────────────
function CourtButton({
  ca,
  isSelected,
  onClick,
}: {
  ca: CourtAvailability;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = getStatus(ca);
  const isIndoor = ca.court.type === "indoor";
  const available = ca.slots.filter((s) => s.available).length;

  const glowRgba = isIndoor ? "rgba(220,100,40,0.55)" : "rgba(220,130,60,0.55)";

  const borderCls = isSelected
    ? isIndoor
      ? "border-orange-600"
      : "border-orange-400"
    : status === "full"
      ? "border-red-500/40"
      : isIndoor
        ? "border-orange-700/40"
        : "border-orange-500/40";

  const pillCls =
    status === "full"
      ? "bg-red-500/25 text-red-300"
      : status === "limited"
        ? "bg-amber-500/25 text-amber-200"
        : isIndoor
          ? "bg-orange-700/25 text-orange-200"
          : "bg-orange-500/25 text-orange-200";

  const pillText = status === "full" ? "Ocupada" : `${available} libres`;

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center gap-1.5
        focus:outline-none
        transition-all duration-200 ease-out
        ${isSelected ? "scale-110 z-20" : "hover:scale-[1.07] hover:z-10"}
      `}>
      {/* Court card */}
      <div
        className={`relative rounded-xl border-2 overflow-hidden transition-all duration-200 ${borderCls}`}
        style={{
          width: 110,
          height: 72,
          boxShadow: isSelected
            ? `0 0 0 3px ${glowRgba}, 0 12px 36px rgba(0,0,0,0.6)`
            : "0 4px 16px rgba(0,0,0,0.4)",
        }}>
        <TennisCourtSVG
          isIndoor={isIndoor}
          status={status}
          isSelected={isSelected}
        />
      </div>

      {/* Labels */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-white text-[11px] font-semibold tracking-wide leading-none">
          {ca.court.name}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-white/35 text-[9px] uppercase tracking-widest font-mono">
            {isIndoor ? "cubierta" : "exterior"}
          </span>
          <span
            className={`text-[9px] font-mono font-medium px-1.5 py-px rounded-full ${pillCls}`}>
            {pillText}
          </span>
        </div>
      </div>

      {/* Pulse ring when selected */}
      {isSelected && (
        <div
          className={`
            absolute -inset-2 rounded-2xl border-2 animate-pulse pointer-events-none
            ${isIndoor ? "border-orange-600/45" : "border-orange-400/45"}
          `}
        />
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PacificoMap({
  courts,
  selectedCourtId,
  onCourtClick,
}: PacificoMapProps) {
  return (
    <>
      {/* ── Desktop: aerial map ────────────────────────────────────────────── */}
      <style>{`
        @keyframes courtFadeIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)) scale(0.92); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes mapPulse {
          0%, 100% { opacity: 0.05; }
          50%       { opacity: 0.09; }
        }
      `}</style>
      <div
        className="hidden md:block relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ aspectRatio: "16/9" }}>
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(180,74,32,0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 50%, rgba(120,40,16,0.10) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 0%,  rgba(255,255,255,0.03) 0%, transparent 60%),
              linear-gradient(175deg, #111a14 0%, #0e1810 40%, #0c1510 100%)
            `,
          }}>
          {/* Subtle dot grid */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.08]"
            xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="dotgrid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#c47840" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotgrid)" />
          </svg>

          {/* Logo watermark — centred, large, ghosted + slow pulse */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              className="w-56 h-56 object-contain"
              style={{
                filter: "grayscale(1) brightness(4)",
                animation: "mapPulse 6s ease-in-out infinite",
              }}
            />
          </div>

          {/* Subtle vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)",
            }}
          />

          {/* Zone labels */}
          <div className="absolute top-3 left-4 text-white/20 text-[10px] uppercase tracking-widest font-mono">
            Canchas exteriores
          </div>
          <div className="absolute top-3 right-4 text-white/20 text-[10px] uppercase tracking-widest font-mono">
            Canchas cubiertas
          </div>

          {/* Divider between zones */}
          <div
            className="absolute top-6 bottom-6 left-[67%] w-px"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)",
            }}
          />

          {/* Logo + title top-center */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              className="w-7 h-7 rounded-full object-cover opacity-60"
            />
            <span className="text-white/25 text-[10px] uppercase tracking-[0.2em] font-mono">
              Tenis Pacífico · Bahía Blanca
            </span>
          </div>

          <div className="absolute bottom-3 left-3 text-white/15 text-[9px] uppercase tracking-widest font-mono">
            Vista aérea
          </div>
        </div>

        {/* Court buttons — staggered entrance */}
        {courts.map((ca, i) => {
          const pos = COURT_POSITIONS[ca.court.id];
          if (!pos) return null;
          return (
            <div
              key={ca.court.id}
              className="absolute"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
                animation: `courtFadeIn 0.5s ease-out ${i * 80}ms both`,
              }}>
              <CourtButton
                ca={ca}
                isSelected={selectedCourtId === ca.court.id}
                onClick={() => onCourtClick(ca.court)}
              />
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-3 right-3 flex items-center gap-4">
          {[
            { bg: "bg-orange-600/70 border-orange-500/40", label: "Exterior" },
            { bg: "bg-orange-800/70 border-orange-700/40", label: "Cubierta" },
            {
              bg: "bg-red-900/60",
              border: "border-red-500/40",
              label: "Sin turnos",
            },
          ].map(({ bg, border, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 text-white/30 text-[10px] font-mono">
              <div className={`w-3.5 h-2 rounded-sm border ${bg} ${border}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: court grid ──────────────────────────────────────────────── */}
      <div className="md:hidden">
        <style>{`
          @keyframes cardIn {
            from { opacity: 0; transform: translateY(16px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes slotIn {
            from { opacity: 0; transform: scale(0.88); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* 2-column grid of court cards */}
        <div className="grid grid-cols-2 gap-3">
          {courts.map((ca, i) => {
            const status = getStatus(ca);
            const isIndoor = ca.court.type === "indoor";
            const isSelected = selectedCourtId === ca.court.id;
            const available = ca.slots.filter((s) => s.available).length;
            const shortName = ca.court.name.replace(/\s*\(.*\)/, "");

            return (
              <button
                key={ca.court.id}
                onClick={() => onCourtClick(ca.court)}
                className="relative flex flex-col rounded-3xl overflow-hidden focus:outline-none active:scale-[0.96] transition-transform duration-150"
                style={{
                  animation: `cardIn 0.4s ease-out ${i * 60}ms both`,
                  background: isSelected
                    ? "rgba(180,70,30,0.25)"
                    : "rgba(255,255,255,0.04)",
                  border: isSelected
                    ? "1px solid rgba(200,100,40,0.6)"
                    : "0.5px solid rgba(255,255,255,0.08)",
                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(180,70,30,0.2), 0 8px 32px rgba(0,0,0,0.4)"
                    : "0 2px 12px rgba(0,0,0,0.3)",
                }}>
                {/* Court SVG fills the top */}
                <div className="w-full" style={{ aspectRatio: "16/9" }}>
                  <TennisCourtSVG
                    isIndoor={isIndoor}
                    status={status}
                    isSelected={isSelected}
                  />
                </div>

                {/* Info strip */}
                <div className="px-3 py-3 text-left">
                  <div className="text-white font-semibold text-sm leading-tight">
                    {shortName}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-white/30 text-[10px] uppercase tracking-widest font-mono">
                      {isIndoor ? "Cubierta" : "Exterior"}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        status === "full"
                          ? "bg-red-500/20 text-red-300"
                          : status === "limited"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-orange-500/15 text-orange-300"
                      }`}>
                      {status === "full" ? "Ocupada" : `${available} libres`}
                    </span>
                  </div>
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
