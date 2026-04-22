// lib/whatsapp.ts
// Reusable WhatsApp Cloud API helpers.
// Import this wherever you need to send messages (route handlers, cron jobs, etc.)

function getEnv() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error(
      "[WhatsApp] Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID env vars",
    );
  }
  return { token, phoneNumberId };
}

/**
 * Send a plain-text WhatsApp message via Cloud API.
 * `to` — international phone number without "+", e.g. "5491112345678"
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
): Promise<void> {
  const { token, phoneNumberId } = getEnv();

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[WhatsApp] Send failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  console.log(`[WhatsApp] Sent to ${to}:`, data?.messages?.[0]?.id ?? "no id");
}
