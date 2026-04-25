// components/DashboardLayout.tsx
"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/reservar": {
    title: "Reservar turno",
    subtitle: "Elegí una cancha y un horario disponible",
  },
  "/mis-turnos": { title: "Mis turnos", subtitle: "Tus reservas activas" },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const meta = PAGE_TITLES[pathname ?? ""];

  const handleClose = useCallback(() => setMobileOpen(false), []);

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: "linear-gradient(160deg, #080f0a 0%, #0a140c 100%)",
      }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleClose} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-4 md:px-6 py-3 flex-shrink-0 sticky top-0 z-30"
          style={{
            background: "rgba(8,15,10,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "0.5px solid rgba(255,255,255,0.07)",
            paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          }}>
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden flex flex-col gap-1.5 w-9 h-9 items-center justify-center rounded-xl transition-colors hover:bg-white/8 focus:outline-none"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú">
            <span className="w-5 h-0.5 rounded-full bg-white/60" />
            <span className="w-4 h-0.5 rounded-full bg-white/40" />
            <span className="w-5 h-0.5 rounded-full bg-white/60" />
          </button>

          {/* Page title */}
          {meta && (
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-base leading-tight tracking-tight truncate">
                {meta.title}
              </h1>
              <p className="text-white/30 text-xs font-mono hidden sm:block truncate">
                {meta.subtitle}
              </p>
            </div>
          )}

          {/* Logo visible on mobile when no title */}
          {!meta && (
            <div className="flex items-center gap-2.5 flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Pacífico Tenis"
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="text-white font-semibold text-sm">
                Pacífico Tenis
              </span>
            </div>
          )}

          {/* Right slot — status pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid rgba(255,255,255,0.08)",
            }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest">
              En línea
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div
            className="mx-auto w-full max-w-5xl px-4 md:px-6 py-6"
            style={{
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
