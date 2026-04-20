// components/BookingPanel.tsx
'use client'

import { useState } from 'react'
import { Court, CourtAvailability, TimeSlot } from '@/types'
// 🔧 MOCK MODE — swap this line for '@/lib/api-client' to use real API routes
import { createBooking } from '@/lib/mockBackend'

interface BookingPanelProps {
  courtAvailability: CourtAvailability | null
  selectedDate: string
  onClose: () => void
  onBooked: () => void
}

type PanelStep = 'slots' | 'form' | 'success'

export function BookingPanel({ courtAvailability, selectedDate, onClose, onBooked }: BookingPanelProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [step, setStep] = useState<PanelStep>('slots')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!courtAvailability) return null

  const { court, slots } = courtAvailability
  const isIndoor = court.type === 'indoor'

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return
    setSelectedSlot(slot)
    setStep('form')
    setError(null)
  }

  const handleBack = () => {
    setStep('slots')
    setSelectedSlot(null)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!selectedSlot || !name.trim() || !phone.trim()) {
      setError('Por favor completá todos los campos')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await createBooking({
        courtId:   court.id,
        date:      selectedDate,
        timeStart: selectedSlot.time_start,
        timeEnd:   selectedSlot.time_end,
        name,
        phone,
      })
      setStep('success')
      onBooked()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al reservar')
    } finally {
      setLoading(false)
    }
  }

  const accentColor = isIndoor ? 'blue' : 'green'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`
        flex items-center justify-between px-5 py-4 border-b border-white/10
        ${isIndoor
          ? 'bg-gradient-to-r from-blue-950/80 to-slate-900/80'
          : 'bg-gradient-to-r from-green-950/80 to-slate-900/80'
        }
      `}>
        <div>
          <h2 className="text-white font-bold text-lg tracking-tight">{court.name}</h2>
          <span className={`text-xs uppercase tracking-widest font-mono ${isIndoor ? 'text-blue-400' : 'text-green-400'}`}>
            {isIndoor ? 'Cubierta' : 'Al aire libre'} · {formatDisplayDate(selectedDate)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors text-lg"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* STEP: slots */}
        {step === 'slots' && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-4 font-mono">
              Turnos disponibles
            </p>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time_start}
                  onClick={() => handleSlotSelect(slot)}
                  disabled={!slot.available}
                  className={`
                    rounded-lg py-2.5 px-2 text-sm font-mono font-medium
                    transition-all duration-150 border
                    ${slot.available
                      ? isIndoor
                        ? 'bg-blue-900/40 border-blue-500/40 text-blue-200 hover:bg-blue-800/60 hover:border-blue-400 hover:scale-105 active:scale-95'
                        : 'bg-green-900/40 border-green-500/40 text-green-200 hover:bg-green-800/60 hover:border-green-400 hover:scale-105 active:scale-95'
                      : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed line-through'
                    }
                  `}
                >
                  <div>{slot.time_start}</div>
                  <div className="text-[10px] opacity-60 font-normal mt-0.5">
                    {slot.available ? 'libre' : 'ocupado'}
                  </div>
                </button>
              ))}
            </div>

            {slots.every((s) => !s.available) && (
              <div className="mt-6 text-center">
                <div className="text-4xl mb-2">🎾</div>
                <p className="text-white/40 text-sm">No hay turnos disponibles para este día.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP: form */}
        {step === 'form' && selectedSlot && (
          <div>
            {/* Selected slot summary */}
            <div className={`
              rounded-xl p-4 mb-5 border
              ${isIndoor
                ? 'bg-blue-900/30 border-blue-500/30'
                : 'bg-green-900/30 border-green-500/30'
              }
            `}>
              <div className="text-xs uppercase tracking-widest text-white/40 font-mono mb-1">Turno seleccionado</div>
              <div className="text-white font-bold text-xl font-mono">
                {selectedSlot.time_start} — {selectedSlot.time_end}
              </div>
              <div className="text-white/50 text-sm mt-0.5">{court.name} · {formatDisplayDate(selectedDate)}</div>
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/40 font-mono mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan García"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/40 font-mono mb-1.5">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 px-3 py-2.5 rounded-lg bg-red-950/50 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* STEP: success */}
        {step === 'success' && selectedSlot && (
          <div className="text-center py-6">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4
              ${isIndoor ? 'bg-blue-900/50' : 'bg-green-900/50'}
            `}>
              ✓
            </div>
            <h3 className="text-white font-bold text-xl mb-1">¡Reserva confirmada!</h3>
            <p className="text-white/50 text-sm mb-5">
              {court.name} · {selectedSlot.time_start}–{selectedSlot.time_end}
            </p>
            <div className={`
              rounded-xl p-4 text-left border mb-4
              ${isIndoor ? 'bg-blue-900/20 border-blue-500/20' : 'bg-green-900/20 border-green-500/20'}
            `}>
              <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-2">Detalle</div>
              <div className="space-y-1 text-sm text-white/70">
                <div><span className="text-white/30">Titular:</span> {name}</div>
                <div><span className="text-white/30">Tel:</span> {phone}</div>
                <div><span className="text-white/30">Fecha:</span> {formatDisplayDate(selectedDate)}</div>
                <div><span className="text-white/30">Cancha:</span> {court.name}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
            >
              Volver al mapa
            </button>
          </div>
        )}
      </div>

      {/* Footer actions */}
      {step === 'form' && (
        <div className="px-5 pb-5 pt-3 border-t border-white/10 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !phone.trim()}
            className={`
              w-full py-3 rounded-xl font-semibold text-sm tracking-wide
              transition-all duration-150 active:scale-98
              disabled:opacity-40 disabled:cursor-not-allowed
              ${isIndoor
                ? 'bg-blue-500 hover:bg-blue-400 text-white'
                : 'bg-green-500 hover:bg-green-400 text-white'
              }
            `}
          >
            {loading ? 'Reservando...' : 'Confirmar reserva'}
          </button>
          <button
            onClick={handleBack}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors"
          >
            Cambiar horario
          </button>
        </div>
      )}
    </div>
  )
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}
