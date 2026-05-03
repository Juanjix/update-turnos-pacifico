// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  total: number;
  confirmed: number;
  cancelled: number;
  today: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        {
          label: "Total reservas",
          value: stats.total,
          icon: "📋",
          color: "rgba(59,130,246,0.15)",
          border: "rgba(59,130,246,0.25)",
        },
        {
          label: "Confirmadas",
          value: stats.confirmed,
          icon: "✅",
          color: "rgba(34,197,94,0.12)",
          border: "rgba(34,197,94,0.25)",
        },
        {
          label: "Canceladas",
          value: stats.cancelled,
          icon: "❌",
          color: "rgba(200,40,30,0.12)",
          border: "rgba(200,40,30,0.25)",
        },
        {
          label: "Hoy",
          value: stats.today,
          icon: "📅",
          color: "rgba(196,80,31,0.15)",
          border: "rgba(196,80,31,0.3)",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl h-24 animate-pulse"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                }}
              />
            ))
          : cards.map(({ label, value, icon, color, border }) => (
              <div
                key={label}
                className="rounded-2xl p-4"
                style={{ background: color, border: `0.5px solid ${border}` }}>
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-white font-bold text-3xl">{value}</div>
                <div className="text-white/40 text-xs font-mono uppercase tracking-widest mt-0.5">
                  {label}
                </div>
              </div>
            ))}
      </div>

      {/* Quick action */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.08)",
        }}>
        <h2 className="text-white font-semibold mb-3">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/turnos"
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.97]"
            style={{
              background: "rgba(59,130,246,0.2)",
              border: "0.5px solid rgba(59,130,246,0.35)",
            }}>
            Ver todos los turnos →
          </Link>
          <Link
            href="/reservar"
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid rgba(255,255,255,0.1)",
            }}>
            Ver mapa del club
          </Link>
        </div>
      </div>
    </div>
  );
}
