// components/Sidebar.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  {
    href: "/reservar",
    icon: "🎾",
    label: "Reservar turno",
    sublabel: "Elegí cancha y horario",
  },
  {
    href: "/mis-turnos",
    icon: "📅",
    label: "Mis turnos",
    sublabel: "Ver y cancelar reservas",
  },
] as const;

// ─── Sidebar inner (shared between desktop + drawer) ─────────────────────────

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="px-4 pt-5 pb-6 flex items-center gap-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Club Pacífico Tenis"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          style={{ boxShadow: "0 0 0 1.5px rgba(255,255,255,0.1)" }}
        />
        <div className="min-w-0">
          <div className="text-white font-bold text-sm leading-tight tracking-tight truncate">
            Club Pacífico Tenis
          </div>
          <div className="text-white/30 text-[10px] uppercase tracking-widest font-mono truncate">
            Bahía Blanca
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-white/20 text-[9px] uppercase tracking-widest font-mono px-3 mb-3">
          Menú
        </div>

        {NAV.map(({ href, icon, label, sublabel }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative"
              style={{
                background: active ? "rgba(196, 80, 31, 0.18)" : "transparent",
                border: active
                  ? "0.5px solid rgba(196, 80, 31, 0.35)"
                  : "0.5px solid transparent",
              }}>
              {/* Active indicator bar */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{
                    background: "linear-gradient(180deg, #e06830, #b84020)",
                  }}
                />
              )}

              {/* Icon */}
              <span
                className="text-lg w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                style={{
                  background: active
                    ? "rgba(196,80,31,0.2)"
                    : "rgba(255,255,255,0.05)",
                }}>
                {icon}
              </span>

              {/* Text */}
              <div className="min-w-0">
                <div
                  className="text-sm font-semibold leading-tight truncate transition-colors"
                  style={{ color: active ? "#fff" : "rgba(255,255,255,0.65)" }}>
                  {label}
                </div>
                <div
                  className="text-[10px] font-mono truncate mt-0.5"
                  style={{
                    color: active
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(255,255,255,0.22)",
                  }}>
                  {sublabel}
                </div>
              </div>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="pt-3 pb-1">
          <div
            style={{ height: "0.5px", background: "rgba(255,255,255,0.06)" }}
          />
        </div>

        {/* Settings placeholder */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed"
          title="Próximamente">
          <span
            className="text-lg w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            ⚙️
          </span>
          <div className="min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: "rgba(255,255,255,0.2)" }}>
              Configuración
            </div>
            <div
              className="text-[10px] font-mono"
              style={{ color: "rgba(255,255,255,0.1)" }}>
              Próximamente
            </div>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-white/25 text-[10px] font-mono uppercase tracking-widest">
            En línea
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Sidebar export ──────────────────────────────────────────────────────

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [mobileOpen, onMobileClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarBg = {
    background: "linear-gradient(180deg, #0c1a10 0%, #0a150d 100%)",
    borderRight: "0.5px solid rgba(255,255,255,0.07)",
  };

  return (
    <>
      {/* ── Desktop: fixed sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 h-screen sticky top-0"
        style={sidebarBg}>
        <SidebarContent />
      </aside>

      {/* ── Mobile: drawer ─────────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={onMobileClose}
        className="md:hidden fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: mobileOpen ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
          backdropFilter: mobileOpen ? "blur(3px)" : "none",
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col transition-transform duration-350"
        style={{
          ...sidebarBg,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.32s cubic-bezier(0.32,0.72,0,1)",
        }}>
        {/* Close button */}
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
          ✕
        </button>

        <SidebarContent onNavClick={onMobileClose} />
      </div>
    </>
  );
}
