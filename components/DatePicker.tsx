// components/DatePicker.tsx
"use client";

import { useRef, useEffect } from "react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const today = new Date();
  const todayStr = toISODate(today);
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  // Auto-scroll selected date into view
  useEffect(() => {
    const idx = days.findIndex((d) => toISODate(d) === value);
    if (idx > 0 && scrollRef.current) {
      const el = scrollRef.current.children[idx] as HTMLElement;
      el?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      style={{
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}>
      {days.map((d) => {
        const dateStr = toISODate(d);
        const isSelected = dateStr === value;
        const isToday = dateStr === todayStr;
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const dayName = d.toLocaleDateString("es-AR", { weekday: "short" });
        const dayNum = d.getDate();
        const monthAbbr = d.toLocaleDateString("es-AR", { month: "short" });

        return (
          <button
            key={dateStr}
            onClick={() => onChange(dateStr)}
            className="flex-shrink-0 flex flex-col items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 focus:outline-none"
            style={{
              scrollSnapAlign: "start",
              width: 52,
              height: 68,
              background: isSelected
                ? "linear-gradient(135deg, #c4501f 0%, #a03a15 100%)"
                : isWeekend
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.03)",
              border: isSelected
                ? "0.5px solid rgba(200,100,40,0.6)"
                : isToday
                  ? "0.5px solid rgba(255,255,255,0.2)"
                  : "0.5px solid rgba(255,255,255,0.07)",
              boxShadow: isSelected
                ? "0 4px 20px rgba(180,70,20,0.35)"
                : "none",
              transform: isSelected ? "scale(1.05)" : "scale(1)",
            }}>
            <span
              className="text-[10px] uppercase tracking-widest font-mono mb-0.5"
              style={{
                color: isSelected
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(255,255,255,0.3)",
              }}>
              {dayName}
            </span>
            <span
              className="text-xl font-bold leading-none"
              style={{
                color: isSelected
                  ? "#fff"
                  : isWeekend
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.8)",
              }}>
              {dayNum}
            </span>
            {isToday && !isSelected && (
              <div className="w-1 h-1 rounded-full mt-1 bg-orange-400" />
            )}
            {isSelected && (
              <span
                className="text-[9px] font-mono mt-0.5"
                style={{ color: "rgba(255,255,255,0.6)" }}>
                {monthAbbr}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
