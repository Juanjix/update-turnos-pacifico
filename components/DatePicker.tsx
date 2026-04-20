// components/DatePicker.tsx
'use client'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const today = new Date()
  const todayStr = toISODate(today)

  // Generate next 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {days.map((d) => {
        const dateStr = toISODate(d)
        const isSelected = dateStr === value
        const isToday = dateStr === todayStr
        const dayName = d.toLocaleDateString('es-AR', { weekday: 'short' })
        const dayNum = d.getDate()

        return (
          <button
            key={dateStr}
            onClick={() => onChange(dateStr)}
            className={`
              flex-shrink-0 flex flex-col items-center justify-center
              w-12 h-14 rounded-xl border text-xs
              transition-all duration-150
              ${isSelected
                ? 'bg-green-500 border-green-400 text-white scale-105'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:scale-105'
              }
            `}
          >
            <span className="uppercase tracking-wider font-mono">{dayName}</span>
            <span className={`text-base font-bold mt-0.5 ${isSelected ? 'text-white' : ''}`}>{dayNum}</span>
            {isToday && (
              <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-green-500'}`} />
            )}
          </button>
        )
      })}
    </div>
  )
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
