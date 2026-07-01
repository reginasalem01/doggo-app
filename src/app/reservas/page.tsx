'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type View = 'list' | 'form'
type ReservationType = 'mesa' | 'evento'

type MyReservation = {
  id: string
  customer_name: string
  reservation_date: string
  reservation_time: string
  party_size: number
  status: string
  notes: string | null
}

// Deben coincidir con VALID_TIMES del servidor (horario almuerzo + cena)
const HOURS = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending:   { label: 'Pendiente',       color: 'bg-yellow-100 text-yellow-700', icon: '🕐' },
  modified:  { label: 'Cambio enviado',  color: 'bg-blue-100 text-blue-700',     icon: '✏️' },
  confirmed: { label: 'Confirmada',      color: 'bg-green-100 text-green-700',   icon: '✅' },
  cancelled: { label: 'Cancelada',       color: 'bg-red-100 text-red-500',       icon: '❌' },
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function ReservasPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('list')

  // ── Mis reservas ──────────────────────────────────────────────
  const [reservations, setReservations] = useState<MyReservation[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editPartySize, setEditPartySize] = useState(2)
  const [editLoading, setEditLoading] = useState(false)

  function isPast(r: MyReservation) {
    // Build a datetime from date + time and compare to now
    const dt = new Date(`${r.reservation_date}T${r.reservation_time.slice(0, 5)}`)
    return dt < new Date()
  }

  const sortRes = (data: MyReservation[]) => {
    const order: Record<string, number> = { pending: 0, modified: 0, confirmed: 1, cancelled: 2 }
    return [...data]
      .filter((r) => !isPast(r))
      .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
  }

  useEffect(() => {
    // Prefer phone-based lookup (gets ALL reservations for this user automatically)
    const savedPhone = localStorage.getItem('doggo_customer_phone')
    if (savedPhone) {
      fetch(`/api/reservations?phone=${encodeURIComponent(savedPhone)}`)
        .then((r) => r.json())
        .then((data: unknown) => { if (Array.isArray(data)) setReservations(sortRes(data as MyReservation[])) })
        .catch(() => {})
        .finally(() => setLoadingList(false))
      return
    }
    // Fallback: lookup by stored IDs
    try {
      const ids = JSON.parse(localStorage.getItem('doggo_reservation_ids') ?? '[]') as string[]
      if (ids.length === 0) { setLoadingList(false); return }
      fetch(`/api/reservations?ids=${ids.join(',')}`)
        .then((r) => r.json())
        .then((data: unknown) => { if (Array.isArray(data)) setReservations(sortRes(data as MyReservation[])) })
        .catch(() => {})
        .finally(() => setLoadingList(false))
    } catch { setLoadingList(false) }
  }, [])

  function startEdit(r: MyReservation) {
    setEditingId(r.id)
    setEditDate(r.reservation_date)
    setEditTime(r.reservation_time.slice(0, 5))
    setEditPartySize(r.party_size)
  }

  async function handleSaveEdit(id: string) {
    setEditLoading(true)
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          reservation_date: editDate,
          reservation_time: editTime + ':00',
          party_size: editPartySize,
        }),
      })
      if (res.ok) {
        setReservations((prev) => prev.map((r) =>
          r.id === id
            ? { ...r, reservation_date: editDate, reservation_time: editTime + ':00', party_size: editPartySize, status: 'modified' }
            : r
        ))
        setEditingId(null)
      } else {
        const data = await res.json()
        alert(data.error ?? 'No se pudo guardar el cambio')
      }
    } finally { setEditLoading(false) }
  }

  async function handleCancelReservation(id: string) {
    if (!confirm('¿Cancelar esta reserva?')) return
    setEditLoading(true)
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', phone: phone.trim() }),
      })
      if (res.ok) {
        setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: 'cancelled' } : r))
        setEditingId(null)
      } else {
        const data = await res.json()
        alert(data.error ?? 'No se pudo cancelar')
      }
    } finally { setEditLoading(false) }
  }

  // ── Nueva reserva (form) ──────────────────────────────────────
  const [type, setType] = useState<ReservationType>('mesa')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(() => { try { return localStorage.getItem('doggo_checkout_name') ?? '' } catch { return '' } })
  const [phone, setPhone] = useState(() => { try { return localStorage.getItem('doggo_customer_phone') ?? '' } catch { return '' } })
  const [email, setEmail] = useState(() => { try { return localStorage.getItem('doggo_checkout_email') ?? '' } catch { return '' } })
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [eventName, setEventName] = useState('')
  const [guestCount, setGuestCount] = useState(15)
  const [eventDescription, setEventDescription] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!date || !time) { setError('Por favor selecciona fecha y hora.'); return }
    if (new Date(date) < new Date(todayStr())) { setError('No puedes reservar en fechas pasadas.'); return }

    setLoading(true)
    try {
      const parts: string[] = []
      if (type === 'evento') {
        if (eventName) parts.push(`Evento: ${eventName}`)
        if (eventDescription) parts.push(`Descripción: ${eventDescription}`)
      }
      if (notes) parts.push(notes)

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          customer_email: email || null,
          reservation_date: date,
          reservation_time: time + ':00',
          party_size: type === 'mesa' ? partySize : guestCount,
          notes: parts.join('\n') || null,
          status: 'pending',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar la reserva')
      // Save phone so we can auto-load all reservations next time
      try { localStorage.setItem('doggo_customer_phone', phone.trim()) } catch {}
      router.push(`/reservas/confirmacion?id=${data.id}`)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Error al guardar la reserva')
    } finally { setLoading(false) }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-safe z-20 border-b border-gray-200 flex items-center gap-3">
        {view === 'form' && (
          <button onClick={() => setView('list')} className="text-gray-500 text-xl leading-none">←</button>
        )}
        <h1 className="text-gray-900 text-xl font-black">
          {view === 'list' ? 'Reservas' : 'Nueva reserva'}
        </h1>
      </div>

      {/* ── VISTA: MIS RESERVAS ── */}
      {view === 'list' && (
        <div className="px-4 py-5 pb-28">
          {loadingList ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-doggo-yellow border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reservations.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-6xl mb-4">📅</span>
              <p className="text-gray-900 text-xl font-black mb-1">Sin reservas aún</p>
              <p className="text-gray-400 text-sm mb-8">Reserva una mesa o un espacio para tu evento.</p>
              <button
                onClick={() => setView('form')}
                className="bg-doggo-yellow text-doggo-dark font-black py-4 px-8 rounded-full text-base"
              >
                Hacer una reserva
              </button>
            </div>
          ) : (
            /* Lista de reservas */
            <div className="space-y-3">
              {reservations.map((r) => {
                const dateStr = new Date(r.reservation_date + 'T12:00:00').toLocaleDateString('es-EC', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })
                const s = STATUS_CONFIG[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600', icon: '📋' }
                const isEditing = editingId === r.id
                const canEdit = r.status !== 'cancelled'

                return (
                  <div key={r.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-gray-900 font-black text-sm capitalize">{dateStr}</p>
                        <p className="text-gray-600 text-sm">
                          {r.reservation_time.slice(0, 5)} · {r.party_size} {r.party_size === 1 ? 'persona' : 'personas'}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${s.color}`}>
                        {s.icon} {s.label}
                      </span>
                    </div>

                    {r.status === 'pending' && !isEditing && (
                      <p className="text-gray-400 text-xs mb-2">Pronto recibirás confirmación por WhatsApp.</p>
                    )}
                    {r.status === 'modified' && !isEditing && (
                      <p className="text-blue-500 text-xs mb-2">✏️ Tu cambio fue enviado. Espera confirmación.</p>
                    )}

                    {/* Edición inline */}
                    {isEditing && (
                      <div className="mt-2 space-y-3 pt-2 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Fecha</label>
                            <input type="date" value={editDate} min={todayStr()} onChange={(e) => setEditDate(e.target.value)}
                              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40" />
                          </div>
                          <div>
                            <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Hora</label>
                            <select value={editTime} onChange={(e) => setEditTime(e.target.value)}
                              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40">
                              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Personas</label>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setEditPartySize(Math.max(1, editPartySize - 1))}
                              className="w-9 h-9 rounded-full bg-gray-200 text-gray-900 text-lg font-bold flex items-center justify-center">−</button>
                            <span className="text-gray-900 text-xl font-black w-6 text-center">{editPartySize}</span>
                            <button type="button" onClick={() => setEditPartySize(Math.min(20, editPartySize + 1))}
                              className="w-9 h-9 rounded-full bg-gray-200 text-gray-900 text-lg font-bold flex items-center justify-center">+</button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveEdit(r.id)} disabled={editLoading}
                            className="flex-1 bg-doggo-yellow text-doggo-dark font-black py-2.5 rounded-xl text-sm disabled:opacity-60">
                            {editLoading ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button onClick={() => setEditingId(null)} disabled={editLoading}
                            className="px-4 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm">
                            Cerrar
                          </button>
                        </div>
                        <button onClick={() => handleCancelReservation(r.id)} disabled={editLoading}
                          className="w-full text-red-500 font-semibold text-sm py-1">
                          Cancelar reserva
                        </button>
                      </div>
                    )}

                    {!isEditing && canEdit && (
                      <button onClick={() => startEdit(r)}
                        className="mt-2 w-full text-gray-400 font-semibold text-xs py-1.5 border border-gray-200 rounded-xl">
                        ✏️ Editar
                      </button>
                    )}
                  </div>
                )
              })}

              {/* Botón nueva reserva al final de la lista */}
              <button
                onClick={() => setView('form')}
                className="w-full bg-doggo-yellow text-doggo-dark font-black py-4 rounded-full text-base mt-2"
              >
                + Nueva reserva
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── VISTA: FORMULARIO ── */}
      {view === 'form' && (
        <div className="px-4 py-5 pb-28 space-y-5">
          {/* Tipo */}
          <div className="flex bg-gray-100 rounded-full p-1">
            <button type="button" onClick={() => setType('mesa')}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${type === 'mesa' ? 'bg-doggo-yellow text-doggo-dark' : 'text-gray-500'}`}>
              🪑 Mesa
            </button>
            <button type="button" onClick={() => setType('evento')}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${type === 'evento' ? 'bg-doggo-yellow text-doggo-dark' : 'text-gray-500'}`}>
              🎉 Evento
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'evento' && (
              <div>
                <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Nombre del evento *</label>
                <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)}
                  placeholder="Ej: Cumpleaños de Ana..." required
                  className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400" />
              </div>
            )}

            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Tu nombre *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo" required
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400" />
            </div>

            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Teléfono *</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="0999 000 000" required
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400" />
            </div>

            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Email (opcional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Fecha *</label>
                <input type="date" value={date} min={todayStr()} onChange={(e) => setDate(e.target.value)} required
                  className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40" />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Hora *</label>
                <div className="relative">
                  <select value={time} onChange={(e) => setTime(e.target.value)} required
                    className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 appearance-none pr-10">
                    <option value="">Seleccionar</option>
                    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</span>
                </div>
              </div>
            </div>

            {type === 'mesa' && (
              <div>
                <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wide">Número de personas *</label>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setPartySize(Math.max(1, partySize - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 text-gray-900 text-xl font-bold flex items-center justify-center">−</button>
                  <span className="text-gray-900 text-2xl font-black w-8 text-center">{partySize}</span>
                  <button type="button" onClick={() => setPartySize(Math.min(10, partySize + 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 text-gray-900 text-xl font-bold flex items-center justify-center">+</button>
                  <span className="text-gray-500 text-sm">personas</span>
                </div>
                {partySize === 10 && (
                  <p className="text-gray-500 text-xs mt-2">
                    ¿Más de 10? Cambia a{' '}
                    <button type="button" onClick={() => setType('evento')} className="underline font-semibold">Evento</button>
                  </p>
                )}
              </div>
            )}

            {type === 'evento' && (
              <div>
                <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wide">Número de invitados *</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setGuestCount(Math.max(11, guestCount - 5))}
                    className="w-10 h-10 rounded-full bg-gray-100 text-gray-900 text-xl font-bold flex items-center justify-center">−</button>
                  <span className="text-gray-900 text-2xl font-black w-10 text-center">{guestCount}</span>
                  <button type="button" onClick={() => setGuestCount(guestCount + 5)}
                    className="w-10 h-10 rounded-full bg-gray-100 text-gray-900 text-xl font-bold flex items-center justify-center">+</button>
                  <span className="text-gray-500 text-sm">invitados</span>
                </div>
              </div>
            )}

            {type === 'evento' && (
              <div>
                <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Descripción del evento (opcional)</label>
                <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Cuéntanos qué tienes en mente..." rows={3}
                  className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400 resize-none" />
              </div>
            )}

            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Notas adicionales (opcional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder={type === 'mesa' ? 'Alergias, preferencias de mesa, ocasión especial...' : 'Cualquier detalle adicional...'}
                rows={2}
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400 resize-none" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-doggo-yellow text-doggo-dark font-black py-4 rounded-full text-base disabled:opacity-60">
              {loading ? 'Enviando...' : type === 'mesa' ? '📅 Confirmar reserva' : '🎉 Solicitar evento'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
