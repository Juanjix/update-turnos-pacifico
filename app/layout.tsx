// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

// ─── Change these to match your actual production domain ──────────────────────
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://update-turnos-pacifico.vercel.app";
const SITE_NAME = "Club Pacífico Tenis";

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // ── Core ────────────────────────────────────────────────────────────────────
  title: {
    default: "Club Pacífico Tenis — Reservas Online",
    template: "%s · Club Pacífico Tenis",
  },
  description:
    "Reservá tu cancha de tenis online en el Club Pacífico de Bahía Blanca. " +
    "6 canchas disponibles: 4 descubiertas y 2 cubiertas. Reservas en tiempo real.",
  keywords: [
    "tenis Bahía Blanca",
    "reserva cancha tenis",
    "Club Pacífico Tenis",
    "cancha tenis Bahía Blanca",
    "reservas online tenis",
  ],

  // ── Authors / verification ───────────────────────────────────────────────────
  authors: [{ name: "Club Pacífico Tenis", url: SITE_URL }],
  creator: "Club Pacífico Tenis",
  publisher: "Club Pacífico Tenis",

  // ── Open Graph ───────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Club Pacífico Tenis — Reservas Online",
    description:
      "Reservá tu cancha de tenis online en el Club Pacífico de Bahía Blanca. " +
      "6 canchas disponibles en tiempo real.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Club Pacífico Tenis — Sistema de Reservas — Bahía Blanca",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X ──────────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Club Pacífico Tenis — Reservas Online",
    description:
      "Reservá tu cancha de tenis online · Club Pacífico · Bahía Blanca",
    images: ["/og-image.png"],
  },

  // ── Icons (all sizes) ────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },

  // ── PWA manifest ─────────────────────────────────────────────────────────────
  manifest: "/site.webmanifest",

  // ── Robots ───────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Canonical ────────────────────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },
};

// ── Viewport / theme color (separate export per Next 14+) ─────────────────────
export const viewport: Viewport = {
  themeColor: "#0b1e12",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // handles iPhone notch / Dynamic Island
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsClub",
              name: "Club Pacífico Tenis",
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
              image: `${SITE_URL}/og-image.png`,
              description:
                "Club de tenis en Bahía Blanca con 6 canchas disponibles para reserva online.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Bahía Blanca",
                addressRegion: "Buenos Aires",
                addressCountry: "AR",
              },
              sport: "Tennis",
              amenityFeature: [
                {
                  "@type": "LocationFeatureSpecification",
                  name: "Canchas descubiertas",
                  value: 4,
                },
                {
                  "@type": "LocationFeatureSpecification",
                  name: "Canchas cubiertas",
                  value: 2,
                },
                {
                  "@type": "LocationFeatureSpecification",
                  name: "Reservas online",
                  value: true,
                },
              ],
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
