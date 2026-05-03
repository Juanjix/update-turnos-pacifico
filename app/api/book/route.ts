// app/api/book/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BookingResponse } from "@/types";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<BookingResponse>(
      { success: false, error: "Body JSON inválido" },
      { status: 400 },
    );
  }

  const {
    courtId,
    date,
    timeStart,
    timeEnd,
    name,
    phone,
    gameType,
    players,
    isMember,
  } = body as {
    courtId?: string;
    date?: string;
    timeStart?: string;
    timeEnd?: string;
    name?: string;
    phone?: string;
    gameType?: string;
    players?: unknown;
    isMember?: boolean;
  };

  if (!courtId || !date || !timeStart || !timeEnd) {
    return NextResponse.json<BookingResponse>(
      { success: false, error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }

  try {
    const { createBooking } = await import("@/lib/db");

    const booking = await createBooking({
      courtId,
      date,
      timeStart,
      timeEnd,
      name: (name as string) ?? "",
      phone: (phone as string) ?? "",
      gameType: (gameType as "singles" | "doubles") ?? "singles",
      players: (players as { name: string; phone: string }[]) ?? [
        { name: name ?? "", phone: phone ?? "" },
      ],
      isMember: isMember ?? false,
    });

    return NextResponse.json<BookingResponse>(
      { success: true, booking },
      { status: 201 },
    );
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Error al crear la reserva";
    console.error("[book] error:", msg);
    const status =
      msg.includes("ocupado") || msg.includes("tomado") ? 409 : 400;
    return NextResponse.json<BookingResponse>(
      { success: false, error: msg },
      { status },
    );
  }
}
