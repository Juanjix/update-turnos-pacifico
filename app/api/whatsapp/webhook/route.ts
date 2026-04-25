// app/api/whatsapp/webhook/route.ts
// WhatsApp Cloud API (Meta) — Webhook with booking + cancellation flow

import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { Booking } from "@/types";

// ─── Conversation state ───────────────────────────────────────────────────────
// Keyed by sender phone number. Lives in memory — resets on cold start.
// For production: move to Redis / Supabase with TTL.

type ConversationStep =
  | "idle"
  | "cancel_select" // user asked to cancel, showing list
  | "cancel_confirm"; // user selected one booking, awaiting sí/no

interface ConversationState {
  step: ConversationStep;
  candidates?: Booking[]; // bookings shown to user
  selected?: Booking; // booking pending confirmation
  updatedAt: number;
}

const conversations: Record<string, ConversationState> = {};
const CONV_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getConv(phone: string): ConversationState {
  const c = conversations[phone];
  if (!c || Date.now() - c.updatedAt > CONV_TTL_MS) {
    return { step: "idle", updatedAt: Date.now() };
  }
  return c;
}

function setConv(phone: string, state: Partial<ConversationState>) {
  conversations[phone] = { ...getConv(phone), ...state, updatedAt: Date.now() };
}

function clearConv(phone: string) {
  conversations[phone] = { step: "idle", updatedAt: Date.now() };
}

// ─── WhatsApp payload types ───────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBookingSummary(b: Booking, idx?: number): string {
  const [y, m, d] = b.date.split("-").map(Number);
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const prefix = idx !== undefined ? `*${idx + 1}.* ` : "";
  return `${prefix}📅 ${dateLabel}\n⏰ ${b.time_start} – ${b.time_end}\n🎾 Cancha ${b.court_id}`;
}

function isAffirmative(t: string): boolean {
  return /^(si|sí|s|yes|dale|ok|confirmar|confirm|claro|obvio|por supuesto)$/i.test(
    t.trim(),
  );
}

function isNegative(t: string): boolean {
  return /^(no|nop|nope|cancelar no|volver)$/i.test(t.trim());
}

// ─── GET — Webhook verification ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const verifyToken = process.env.VERIFY_TOKEN;
  if (!verifyToken)
    return new NextResponse("Server misconfigured", { status: 500 });

  const sp = new URL(req.url).searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp] Webhook verified ✓");
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ─── POST — Receive & route messages ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: WhatsAppWebhookBody = await req.json();
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message) return NextResponse.json({ status: "ok" }, { status: 200 });
    if (message.type !== "text")
      return NextResponse.json({ status: "ok" }, { status: 200 });

    const phone = message.from;
    const name = contact?.profile?.name ?? "Usuario";
    const text = message.text.body.trim();

    console.log(`[WhatsApp] ${name} (${phone}): "${text}"`);

    const reply = await routeMessage(phone, name, text);
    await sendWhatsAppMessage(phone, reply);
  } catch (err) {
    console.error("[WhatsApp] POST error:", err);
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

// ─── Message router ───────────────────────────────────────────────────────────

async function routeMessage(
  phone: string,
  name: string,
  text: string,
): Promise<string> {
  const conv = getConv(phone);
  const t = text.toLowerCase();

  // ── In-flow responses take priority ────────────────────────────────────────

  if (conv.step === "cancel_confirm" && conv.selected) {
    return handleCancelConfirm(phone, text, conv.selected);
  }

  if (conv.step === "cancel_select" && conv.candidates?.length) {
    return handleCancelSelect(phone, text, conv.candidates);
  }

  // ── Intent detection ────────────────────────────────────────────────────────

  // Cancel intent
  if (
    t.includes("cancelar") ||
    t.includes("cancelá") ||
    t.includes("baja") ||
    t.includes("anular")
  ) {
    return handleCancelIntent(phone, name);
  }

  // Greeting
  if (t.match(/^(hola|buenas|buen[ao]s|hi|hey|ola)/)) {
    clearConv(phone);
    return `¡Hola ${name}! 👋 Soy el asistente del *Club Pacífico Tenis*.\n\nPuedo ayudarte a:\n• *Reservar* una cancha\n• *Cancelar* un turno\n\n¿Qué necesitás?`;
  }

  // Booking intent
  if (t.includes("reserv") || t.includes("turno") || t.includes("cancha")) {
    clearConv(phone);
    return (
      `¡Perfecto! Para reservar necesito:\n\n` +
      `1️⃣ *Día* (ej: lunes 28)\n` +
      `2️⃣ *Horario* preferido\n` +
      `3️⃣ *Nombre completo*\n\n` +
      `También podés reservar desde nuestra web 🎾`
    );
  }

  if (t.includes("precio") || t.includes("costo") || t.includes("cuánto")) {
    return `Para precios, contactá a recepción del club.\n📍 Club Pacífico Tenis · Bahía Blanca`;
  }

  if (t.includes("horario") || t.includes("abre") || t.includes("cierra")) {
    return `El club opera de *09:00 a 21:00 hs*, todos los días 🕘`;
  }

  if (t.match(/^(gracias|ok|dale|perfecto|listo|bárbaro)/)) {
    clearConv(phone);
    return `¡De nada! Cualquier cosa, acá estoy 😊 🎾`;
  }

  // Default
  clearConv(phone);
  return (
    `Hola ${name} 👋 Soy el asistente del *Club Pacífico Tenis*.\n\n` +
    `Escribí:\n• *"reservar"* — para hacer una reserva\n• *"cancelar"* — para cancelar un turno`
  );
}

// ─── Cancel flow: step 1 — detect intent & show bookings ─────────────────────

async function handleCancelIntent(
  phone: string,
  name: string,
): Promise<string> {
  const { getActiveBookings } = await import("@/lib/db");

  const bookings = await getActiveBookings(phone);

  if (bookings.length === 0) {
    clearConv(phone);
    return `No tenés turnos activos para cancelar, ${name} 👍`;
  }

  if (bookings.length === 1) {
    const b = bookings[0];
    setConv(phone, {
      step: "cancel_confirm",
      selected: b,
      candidates: bookings,
    });
    return (
      `Encontré este turno:\n\n${formatBookingSummary(b)}\n\n` +
      `¿Querés cancelarlo? Respondé *sí* o *no*.`
    );
  }

  // Multiple bookings — ask which one
  setConv(phone, { step: "cancel_select", candidates: bookings });
  const list = bookings.map((b, i) => formatBookingSummary(b, i)).join("\n\n");
  return (
    `Tenés estos turnos activos:\n\n${list}\n\n` +
    `¿Cuál querés cancelar? Respondé con el *número* (1, 2, …)`
  );
}

// ─── Cancel flow: step 2a — user picks from list ──────────────────────────────

async function handleCancelSelect(
  phone: string,
  text: string,
  candidates: Booking[],
): Promise<string> {
  const idx = parseInt(text.trim()) - 1;

  if (isNaN(idx) || idx < 0 || idx >= candidates.length) {
    const list = candidates
      .map((b, i) => formatBookingSummary(b, i))
      .join("\n\n");
    return `No entendí. Respondé con un número entre 1 y ${candidates.length}:\n\n${list}`;
  }

  const selected = candidates[idx];
  setConv(phone, { step: "cancel_confirm", selected, candidates });
  return (
    `Vas a cancelar:\n\n${formatBookingSummary(selected)}\n\n` +
    `¿Confirmás? Respondé *sí* o *no*.`
  );
}

// ─── Cancel flow: step 2b — user confirms or rejects ─────────────────────────

async function handleCancelConfirm(
  phone: string,
  text: string,
  booking: Booking,
): Promise<string> {
  if (isNegative(text)) {
    clearConv(phone);
    return `Perfecto, no cancelamos nada 👍 ¿Necesitás algo más?`;
  }

  if (!isAffirmative(text)) {
    return `Respondé *sí* para confirmar la cancelación, o *no* para volver.`;
  }

  // Confirmed — cancel
  try {
    const { cancelBooking } = await import("@/lib/db");
    await cancelBooking(booking.id);
    clearConv(phone);
    return (
      `✅ Turno cancelado correctamente.\n\n` +
      `${formatBookingSummary(booking)}\n\n` +
      `El horario volvió a estar disponible. ¡Hasta la próxima! 🎾`
    );
  } catch (err: unknown) {
    clearConv(phone);
    const msg = err instanceof Error ? err.message : "Error al cancelar";
    return `No pudimos cancelar el turno: _${msg}_\n\nIntentá de nuevo o contactá al club.`;
  }
}
