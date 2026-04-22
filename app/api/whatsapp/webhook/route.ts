// app/api/whatsapp/webhook/route.ts
// WhatsApp Cloud API (Meta) — Webhook handler
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks

import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// ─── Environment ──────────────────────────────────────────────────────────────

function getVerifyToken(): string | null {
  const t = process.env.VERIFY_TOKEN;
  if (!t) console.error("[WhatsApp] Missing VERIFY_TOKEN env var");
  return t ?? null;
}

// ─── TypeScript types (Meta webhook payload) ──────────────────────────────────

interface WhatsAppTextMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "text";
  text: { body: string };
}

interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

interface WhatsAppValue {
  messaging_product: "whatsapp";
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppTextMessage[];
  statuses?: unknown[];
}

interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{ value: WhatsAppValue; field: string }>;
  }>;
}

// ─── GET — Webhook verification ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const verifyToken = getVerifyToken();
  if (!verifyToken)
    return new NextResponse("Server misconfigured", { status: 500 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("[WhatsApp] Webhook verification attempt:", { mode });

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp] Webhook verified ✓");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp] Verification failed — token mismatch or wrong mode");
  return new NextResponse("Forbidden", { status: 403 });
}

// ─── POST — Receive messages ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: WhatsAppWebhookBody = await req.json();

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    // No message = status/receipt update, acknowledge and exit
    if (!message) return NextResponse.json({ status: "ok" }, { status: 200 });

    if (message.type !== "text") {
      console.log(`[WhatsApp] Ignored non-text type: ${message.type}`);
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    const senderPhone = message.from;
    const senderName = contact?.profile?.name ?? "Usuario";
    const incomingText = message.text.body.trim();

    console.log(
      `[WhatsApp] Message from ${senderName} (${senderPhone}): "${incomingText}"`,
    );

    const reply = buildReply(incomingText, senderName);
    await sendWhatsAppMessage(senderPhone, reply);
  } catch (err) {
    // Always return 200 — non-200 causes Meta to retry, flooding the endpoint
    console.error("[WhatsApp] POST handler error:", err);
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

// ─── Reply logic ──────────────────────────────────────────────────────────────
// Integration point for booking logic — swap buildReply() when ready.

function buildReply(text: string, name: string): string {
  const t = text.toLowerCase();

  if (t.includes("hola") || t.includes("buenas") || t.includes("hi")) {
    return (
      `¡Hola ${name}! 👋 Soy el asistente del *Club Pacífico Tenis*.\n\n` +
      `¿Querés reservar una cancha? Decime qué día y horario preferís.`
    );
  }
  if (t.includes("reserv") || t.includes("turno") || t.includes("cancha")) {
    return (
      `¡Perfecto! Para reservar necesito:\n\n` +
      `1️⃣ *Día* (ej: lunes 28)\n` +
      `2️⃣ *Horario* preferido\n` +
      `3️⃣ *Nombre completo*\n\n` +
      `También podés reservar desde nuestra web 🎾`
    );
  }
  if (t.includes("precio") || t.includes("costo") || t.includes("cuánto")) {
    return `Para consultas de precios, contactá a recepción del club.\n\n📍 Club Pacífico Tenis · Bahía Blanca`;
  }
  if (t.includes("horario") || t.includes("abre") || t.includes("cierra")) {
    return `El club opera de *09:00 a 21:00 hs*, todos los días. 🕘`;
  }
  if (t.includes("gracias") || t.includes("ok") || t.includes("dale")) {
    return `¡De nada! Cualquier cosa, acá estoy 😊 🎾`;
  }

  return (
    `Hola ${name} 👋 Soy el asistente del *Club Pacífico Tenis*.\n\n` +
    `¿Querés reservar una cancha? Escribí *"reservar"* para empezar.`
  );
}
