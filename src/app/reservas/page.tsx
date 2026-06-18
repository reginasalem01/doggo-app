'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buildWhatsAppLink } from '@/lib/utils'

type ReservationType = 'mesa' | 'evento'

// Horarios disponibles (11am – 9pm)
const HOURS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00',
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function ReservasPage() {
  const router = useRouter()
  const [type, setType] = useState<ReservationType>('mesa')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Common fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  // Mesa-specific
  const [partySize, setPartySize] = useState(2)

  // Evento-specific
  const [eventName, setEventName] = useState('')
  const [guestCount, setGuestCount] = useState(15)
  const [eventDescription, setEventDescription] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!date || !time) {
      setError('Por favor selecciona fecha y hora.')
      return
    }
    if (new Date(date) < new Date(todayStr())) {
      setError('No puedes reservar en fechas pasadas.')
      return
    }

    setLoading(true)
    try {
      const notesStr = buildNotes()
      const payload = {
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        reservation_date: date,
        reservation_time: time + ':00',
        party_size: type === 'mesa' ? partySize : guestCount,
        notes: notesStr || null,
        status: 'pending',
      }

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar la reserva')

      // Open WhatsApp with reservation details
      const waMsg = buildWhatsAppMessage(data.id)
      window.open(buildWhatsAppLink(waMsg), '_blank')

      router.push(`/reservas/confirmacion?id=${data.id}`)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Error al guardar la reserva'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function buildNotes(): string {
    const parts: string[] = []
    if (type === 'evento') {
      if (eventName) parts.push(`Evento: ${eventName}`)
      if (eventDescription) parts.push(`Descripción: ${eventDescription}`)
    }
    if (notes) parts.push(notes)
    return parts.join('\n') || ''
  }

  function buildWhatsAppMessage(id: string): string {
    const shortId = id.slice(0, 8).toUpperCase()
    const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('es-EC', {
      weekday: 'long', day: 'numeric', month: 'long',
    })

    if (type === 'mesa') {
      return `Hola Doggo 🌭\n\n📅 *Nueva reserva de mesa* #${shortId}\n\n👤 Nombre: ${name}\n📞 Teléfono: ${phone}\n📆 Fecha: ${dateFormatted}\n⏰ Hora: ${time}\n👥 Personas: ${partySize}${notes ? `\n📝 Notas: ${notes}` : ''}\n\n¡Gracias!`
    } else {
      return `Hola Doggo 🌭\n\n🎉 *Solicitud de evento* #${shortId}\n\n👤 Contacto: ${name}\n📞 Teléfono: ${phone}\n🎊 Evento: ${eventName || 'Sin nombre'}\n📆 Fecha: ${dateFormatted}\n⏰ Hora: ${time}\n👥 Invitados: ${guestCount}${eventDescription ? `\n📝 Descripción: ${eventDescription}` : ''}${notes ? `\n📌 Notas: ${notes}` : ''}\n\n¡Gracias!`
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-4 sticky top-0 z-10 border-b border-gray-200">
        <h1 className="text-gray-900 text-xl font-black">Reservar</h1>
      </div>

      <div className="px-4 py-5 pb-10 space-y-5">

        {/* Type toggle */}
        <div>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Tipo de reserva</p>
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              type="button"
              onClick={() => setType('mesa')}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${
                type === 'mesa' ? 'bg-doggo-yellow text-doggo-dark' : 'text-gray-500'
              }`}
            >
              🪑 Mesa
            </button>
            <button
              type="button"
              onClick={() => setType('evento')}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${
                type === 'evento' ? 'bg-doggo-yellow text-doggo-dark' : 'text-gray-500'
              }`}
            >
              🎉 Evento
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Event name (only for eventos) */}
          {type === 'evento' && (
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
                Nombre del evento *
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ej: Cumpleaños de Ana, Reunión de empresa..."
                required
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
              />
            </div>
          )}

          {/* Contact info */}
          <div>
            <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
              Tu nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              required
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
              Teléfono *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0999 000 000"
              required
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
              Email (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
            />
          </div>

          {/* Date & time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
                Fecha *
              </label>
              <input
                type="date"
                value={date}
                min={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
              />
            </div>
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
                Hora *
              </label>
              <div className="relative">
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 appearance-none pr-10"
                >
                  <option value="">Seleccionar</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</span>
              </div>
            </div>
          </div>

          {/* Party size */}
          {type === 'mesa' && (
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wide">
                Número de personas *
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPartySize(Math.max(1, partySize - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-900 text-xl font-bold flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-gray-900 text-2xl font-black w-8 text-center">{partySize}</span>
                <button
                  type="button"
                  onClick={() => setPartySize(Math.min(10, partySize + 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-900 text-xl font-bold flex items-center justify-center"
                >
                  +
                </button>
                <span className="text-gray-500 text-sm">personas</span>
              </div>
              {partySize === 10 && (
                <p className="text-gray-500 text-xs mt-2">
                  ¿Más de 10? Cambia a <button type="button" onClick={() => setType('evento')} className="underline font-semibold">Evento</button>
                </p>
              )}
            </div>
          )}

          {type === 'evento' && (
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wide">
                Número de invitados *
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGuestCount(Math.max(11, guestCount - 5))}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-900 text-xl font-bold flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-gray-900 text-2xl font-black w-10 text-center">{guestCount}</span>
                <button
                  type="button"
                  onClick={() => setGuestCount(guestCount + 5)}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-900 text-xl font-bold flex items-center justify-center"
                >
                  +
                </button>
                <span className="text-gray-500 text-sm">invitados</span>
              </div>
            </div>
          )}

          {/* Event description */}
          {type === 'evento' && (
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
                Descripción del evento (opcional)
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Cuéntanos qué tienes en mente: decoración, menú especial, actividades..."
                rows={3}
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400 resize-none"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={type === 'mesa' ? 'Alergias, preferencias de mesa, ocasión especial...' : 'Cualquier detalle adicional...'}
              rows={2}
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400 resize-none"
            />
          </div>

          {/* WhatsApp notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💬</span>
            <p className="text-gray-500 text-xs leading-relaxed">
              Al confirmar, abriremos WhatsApp con los datos de tu reserva para que el equipo de Doggo la confirme.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-doggo-yellow text-doggo-dark font-black py-4 rounded-full text-base disabled:opacity-60 transition-opacity"
          >
            {loading ? 'Enviando...' : type === 'mesa' ? '📅 Confirmar reserva' : '🎉 Solicitar evento'}
          </button>
        </form>
      </div>
    </div>
  )
}
