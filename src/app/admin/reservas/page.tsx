import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import ReservationActions from './ReservationActions'

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-green-100 text-green-700 border border-green-200',
  cancelled: 'bg-red-100 text-red-600 border border-red-200',
}

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Pendiente',
  confirmed: '✅ Confirmada',
  cancelled: '❌ Cancelada',
}

export default async function AdminReservasPage() {
  const admin = createAdminClient()
  const { data: reservations } = await admin
    .from('reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  const pendientes = reservations?.filter((r) => r.status === 'pending') ?? []
  const resto = reservations?.filter((r) => r.status !== 'pending') ?? []

  return (
    <div className="h-full flex flex-col bg-white p-4 gap-3 overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <h1 className="text-gray-900 text-xl font-black">Reservas</h1>
        {pendientes.length > 0 && (
          <span className="bg-doggo-yellow text-doggo-dark text-xs font-black px-2.5 py-1 rounded-full">
            {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* 2 columnas: pendientes | historial */}
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
                <ReservationCard key={r.id} r={r} showActions />
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
                <ReservationCard key={r.id} r={r} />
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
}: {
  r: Record<string, unknown>
  showActions?: boolean
}) {
  const date = r.reservation_date as string
  const time = r.reservation_time as string
  const status = r.status as string

  const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('es-EC', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  return (
    <div className={`bg-gray-50 rounded-2xl p-4 ${showActions ? 'border border-doggo-red/20' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-bold">{r.customer_name as string}</p>
          <p className="text-gray-500 text-xs mt-0.5">{r.customer_phone as string}</p>
          <p className="text-gray-900 text-sm font-bold mt-1">
            {dateStr} · {time.slice(0, 5)} · {r.party_size as number} {(r.party_size as number) === 1 ? 'persona' : 'personas'}
          </p>
          {r.notes ? <p className="text-gray-500 text-xs mt-1 line-clamp-2">{String(r.notes)}</p> : null}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-semibold ${STATUS_COLOR[status] ?? ''}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      {showActions && (
        <div className="mt-3">
          <ReservationActions
            reservationId={r.id as string}
            customerPhone={r.customer_phone as string}
            customerName={r.customer_name as string}
            date={date}
            time={time}
          />
        </div>
      )}
    </div>
  )
}
