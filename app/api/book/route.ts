// app/api/book/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { timesOverlap, validateDate, validateTimeRange } from '@/lib/schedule'
import { BookingRequest, BookingResponse, Booking } from '@/types'

export async function POST(req: NextRequest) {
  let body: BookingRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<BookingResponse>(
      { success: false, error: 'Body JSON inválido' },
      { status: 400 }
    )
  }

  const { courtId, date, timeStart, timeEnd, name, phone } = body

  // --- Field validation ---
  if (!courtId || !date || !timeStart || !timeEnd || !name || !phone) {
    return NextResponse.json<BookingResponse>(
      { success: false, error: 'Todos los campos son requeridos' },
      { status: 400 }
    )
  }

  const dateError = validateDate(date)
  if (dateError) {
    return NextResponse.json<BookingResponse>({ success: false, error: dateError }, { status: 400 })
  }

  const timeError = validateTimeRange(timeStart, timeEnd)
  if (timeError) {
    return NextResponse.json<BookingResponse>({ success: false, error: timeError }, { status: 400 })
  }

  const nameTrimmed = name.trim()
  const phoneTrimmed = phone.trim()
  if (nameTrimmed.length < 2) {
    return NextResponse.json<BookingResponse>(
      { success: false, error: 'El nombre es muy corto' },
      { status: 400 }
    )
  }

  // --- Verify court exists ---
  const { data: court, error: courtError } = await supabase
    .from('courts')
    .select('id')
    .eq('id', courtId)
    .single()

  if (courtError || !court) {
    return NextResponse.json<BookingResponse>(
      { success: false, error: 'Cancha no encontrada' },
      { status: 404 }
    )
  }

  // --- Check for overlapping bookings (application-level guard, DB has constraint too) ---
  const { data: existing, error: checkError } = await supabase
    .from('bookings')
    .select('id, time_start, time_end')
    .eq('court_id', courtId)
    .eq('date', date)
    .eq('status', 'confirmed')

  if (checkError) {
    console.error('[book] overlap check error:', checkError)
    return NextResponse.json<BookingResponse>(
      { success: false, error: 'Error al verificar disponibilidad' },
      { status: 500 }
    )
  }

  const hasOverlap = (existing as Pick<Booking, 'id' | 'time_start' | 'time_end'>[]).some((b) =>
    timesOverlap(timeStart, timeEnd, b.time_start, b.time_end)
  )

  if (hasOverlap) {
    return NextResponse.json<BookingResponse>(
      { success: false, error: 'El horario seleccionado ya está ocupado' },
      { status: 409 }
    )
  }

  // --- Create booking ---
  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      court_id: courtId,
      date,
      time_start: timeStart,
      time_end: timeEnd,
      client_name: nameTrimmed,
      client_phone: phoneTrimmed,
      status: 'confirmed',
    })
    .select()
    .single()

  if (insertError) {
    console.error('[book] insert error:', insertError)
    // Postgres exclusion constraint violation
    if (insertError.code === '23P01') {
      return NextResponse.json<BookingResponse>(
        { success: false, error: 'El horario ya fue tomado por otro usuario' },
        { status: 409 }
      )
    }
    return NextResponse.json<BookingResponse>(
      { success: false, error: 'Error al crear la reserva' },
      { status: 500 }
    )
  }

  return NextResponse.json<BookingResponse>(
    { success: true, booking: booking as Booking },
    { status: 201 }
  )
}
