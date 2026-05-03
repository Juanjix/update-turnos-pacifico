// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    getSession().then((session) => {
      if (session) router.replace("/reservar");
      else setChecking(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await signIn(email, password);

      // Fetch role to redirect correctly
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${data.user.id}&select=role`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${data.session.access_token}`,
          },
        },
      );
      const profiles = await res.json();
      const role = profiles?.[0]?.role ?? "USER";

      router.replace(role === "ADMIN" ? "/admin/dashboard" : "/reservar");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(160deg, #080f0a 0%, #0a140c 100%)",
      }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Club Pacífico Tenis"
            className="w-20 h-20 rounded-full object-cover mb-4"
            style={{
              boxShadow:
                "0 0 0 2px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.5)",
            }}
          />
          <h1 className="text-white font-bold text-xl tracking-tight">
            Club Pacífico Tenis
          </h1>
          <p className="text-white/30 text-sm font-mono mt-1">
            Sistema de reservas
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}>
          <h2 className="text-white font-semibold text-lg mb-5">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-white/30 font-mono mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "0.5px solid rgba(255,255,255,0.12)",
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-white/30 font-mono mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "0.5px solid rgba(255,255,255,0.12)",
                }}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm text-red-300"
                style={{
                  background: "rgba(200,40,40,0.12)",
                  border: "0.5px solid rgba(200,40,40,0.2)",
                }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white mt-2 transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #c4501f 0%, #a03a15 100%)",
              }}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/15 text-xs mt-6 font-mono">
          Bahía Blanca · Reservas online
        </p>
      </div>
    </div>
  );
}
