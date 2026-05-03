// app/admin/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

const ADMIN_NAV = [
  { href: "/admin/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/admin/turnos", icon: "📋", label: "Todos los turnos" },
  { href: "/reservar", icon: "🎾", label: "Ver club" },
];

function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "linear-gradient(180deg, #0c1218 0%, #08101a 100%)",
      }}>
      {/* Header */}
      <div
        className="px-4 pt-5 pb-5 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 opacity-80"
          />
          <div>
            <div className="text-white font-bold text-sm">Admin Panel</div>
            <div className="text-white/30 text-[10px] font-mono uppercase tracking-widest">
              Pacífico Tenis
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-white/20 text-[9px] uppercase tracking-widest font-mono px-3 mb-3">
          Administración
        </div>
        {ADMIN_NAV.map(({ href, icon, label }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
              style={{
                background: active ? "rgba(59,130,246,0.15)" : "transparent",
                border: active
                  ? "0.5px solid rgba(59,130,246,0.3)"
                  : "0.5px solid transparent",
              }}>
              <span
                className="text-base w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
                style={{
                  background: active
                    ? "rgba(59,130,246,0.2)"
                    : "rgba(255,255,255,0.05)",
                }}>
                {icon}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div
        className="px-3 pb-5 border-t pt-4"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
          <span
            className="text-base w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: "rgba(200,40,30,0.1)" }}>
            🚪
          </span>
          <span className="text-sm text-white/30 group-hover:text-white/60 transition-colors">
            Cerrar sesión
          </span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const pageTitle = pathname?.includes("/turnos")
    ? "Gestión de turnos"
    : "Dashboard";

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: "linear-gradient(160deg, #060c12 0%, #080e18 100%)",
      }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-52 flex-shrink-0 h-screen sticky top-0"
        style={{ borderRight: "0.5px solid rgba(255,255,255,0.07)" }}>
        <AdminSidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 z-40"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(3px)",
            }}
          />
          <div className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-60">
            <AdminSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="flex items-center gap-4 px-4 md:px-6 py-3 sticky top-0 z-30"
          style={{
            background: "rgba(6,12,18,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "0.5px solid rgba(255,255,255,0.07)",
          }}>
          <button
            className="md:hidden w-9 h-9 flex flex-col gap-1.5 items-center justify-center rounded-xl hover:bg-white/8"
            onClick={() => setMobileOpen(true)}>
            <span className="w-5 h-0.5 rounded-full bg-white/60" />
            <span className="w-4 h-0.5 rounded-full bg-white/40" />
            <span className="w-5 h-0.5 rounded-full bg-white/60" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-base">{pageTitle}</h1>
            <p className="text-white/25 text-xs font-mono">
              Panel de administración
            </p>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest"
            style={{
              background: "rgba(59,130,246,0.12)",
              color: "rgba(96,165,250,0.9)",
              border: "0.5px solid rgba(59,130,246,0.25)",
            }}>
            Admin
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
