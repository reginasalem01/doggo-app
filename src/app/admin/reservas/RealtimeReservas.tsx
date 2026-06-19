'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Reservation = {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  reservation_date: string
  reservation_time: string
  party_size: number
  notes: string | null
  status: string
}

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-green-100 text-green-700 border border-green-200',
  cancelled: 'bg-red-100 text-red-600 border border-red-200',
}
const STATUS_LABEL: Record<string, string> = {
  pending:   '⏳ Pendiente',
  confirmed: '✅ Confirmada',
  cancelled: '❌ Cancelada',
}

export default function RealtimeReservas({ initial }: { initial: Reservation[] }) {
  const [reservations, setReservations] = useState<Reservation[]>(initial)
  async function refresh() {
    const res = await fetch('/api/admin/reservations-list')
    if (res.ok) {
      const data = await res.json()
      setReservations(data)
    }
  }

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('reservations-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (payload) => {
        setReservations((prev) => [...prev, payload.new as Reservation])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservations' }, (payload) => {
        const updated = payload.new as Reservation
        setReservations((prev) => prev.map((r) => r.id === updated.id ? updated : r))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function handleUpdate(id: string, newStatus: string) {
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r))
  }

  const pendientes = reservations.filter((r) => r.status === 'pending')
  const resto = reservations.filter((r) => r.status !== 'pending')
    .sort((a, b) => {
      // Sort historial: confirmed first, then by date desc
      if (a.status !== b.status) return a.status === 'confirmed' ? -1 : 1
      return b.reservation_date.localeCompare(a.reservation_date)
    })

  return (
    <div className="h-full flex flex-col bg-white p-4 gap-3 overflow-hidden">
      <div className="flex items-center gap-3 shrink-0">
        <h1 className="text-gray-900 text-xl font-black">Reservas</h1>
        {pendientes.length > 0 && (
          <span className="bg-doggo-yellow text-doggo-dark text-xs font-black px-2.5 py-1 rounded-full">
            {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
          </span>
        )}
        <button
          onClick={refresh}
          className="ml-auto text-gray-400 hover:text-gray-700 text-xs font-semibold flex items-center gap-1"
        >
          ↻ Actualizar
        </button>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* Pendientes */}
        <div className="flex-1 flex flex-col min-h-0">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2 shrink-0">
            Requieren confirmación ({pendientes.length})
          </p>
          {pendientes.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-5 text-center flex-1 flex flex-col items-center justify-center">
              <p className="text-2xl mb-1">✅</p>
              <p className="text-gray-900 font-bold text-sm">Sin pendientes</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {pendientes.map((r) => (
                <ReservationCard key={r.id} r={r} showActions onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="flex-1 flex flex-col min-h-0">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2 shrink-0">
            Historial ({resto.length})
          </p>
          {resto.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-5 text-center flex-1 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Sin historial aún</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {resto.map((r) => (
                <ReservationCard key={r.id} r={r} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReservationCard({
  r,
  showActions = false,
  onUpdate,
}: {
  r: Reservation
  showActions?: boolean
  onUpdate: (id: string, status: string) => void
}) {
  const [loading, setLoading] = useState(false)

  const dateStr = new Date(r.reservation_date + 'T12:00:00').toLocaleDateString('es-EC', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  async function updateStatus(status: 'confirmed' | 'cancelled') {
    setLoading(true)
    onUpdate(r.id, status) // optimistic
    await fetch(`/api/admin/reservations/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
  }

  function sendWhatsApp() {
    const dateFormatted = new Date(r.reservation_date + 'T12:00:00').toLocaleDateString('es-EC', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const msg = encodeURIComponent(
      `Hola ${r.customer_name} 👋, tu reserva en Doggo ha sido *confirmada* ✅\n📆 ${dateFormatted} a las ${r.reservation_time.slice(0, 5)}\n¡Te esperamos! 🌭`
    )
    const phone = r.customer_phone.replace(/^0/, '')
    window.open(`https://wa.me/593${phone}?text=${msg}`, '_blank')
  }

  return (
    <div className={`bg-gray-50 rounded-2xl p-4 ${showActions ? 'border border-doggo-red/20' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-bold">{r.customer_name}</p>
          <p className="text-gray-500 text-xs mt-0.5">{r.customer_phone}</p>
          <p className="text-gray-900 text-sm font-bold mt-1">
            {dateStr} · {r.reservation_time.slice(0, 5)} · {r.party_size} {r.party_size === 1 ? 'persona' : 'personas'}
          </p>
          {r.notes && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{r.notes}</p>}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-semibold ${STATUS_COLOR[r.status] ?? ''}`}>
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      </div>

      {showActions && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => updateStatus('confirmed')}
            disabled={loading}
            className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-60"
          >
            ✅ Confirmar
          </button>
          <button
            onClick={() => updateStatus('cancelled')}
            disabled={loading}
            className="flex-1 bg-red-500/20 text-red-400 font-bold py-2 rounded-xl text-sm disabled:opacity-60"
          >
            ❌ Cancelar
          </button>
        </div>
      )}

      {/* WhatsApp — solo en confirmadas, nunca en pendientes (evita tap accidental) */}
      {r.status === 'confirmed' && (
        <button
          onClick={sendWhatsApp}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-green-50 text-green-600 font-semibold text-xs py-2 rounded-xl border border-green-100"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Notificar por WhatsApp
        </button>
      )}
    </div>
  )
}
