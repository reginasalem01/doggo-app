import { createAdminClient } from '@/lib/supabase/admin'
import ReservationActions from '@/app/admin/reservas/ReservationActions'

const STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-yellow-500/20 text-yellow-400' },
  confirmed: { label: 'Confirmada', color: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Cancelada',  color: 'bg-red-500/20 text-red-400' },
}

export default async function OwnerReservasPage() {
  const admin = createAdminClient()
  const { data: reservations } = await admin
    .from('reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })
    .limit(200)

  const pending  = reservations?.filter((r) => r.status === 'pending') ?? []
  const rest     = reservations?.filter((r) => r.status !== 'pending') ?? []

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-black">Reservas</h1>
        <p className="text-gray-400 text-sm mt-0.5">{reservations?.length ?? 0} en total</p>
      </div>

      <div className="grid grid-cols-2 gap-6 items-start">

        {/* Left: pendientes */}
        <div>
          <p className="text-doggo-yellow text-xs font-bold uppercase tracking-wide mb-3">
            Pendientes ({pending.length})
          </p>

          {pending.length === 0 ? (
            <div className="bg-doggo-dark2 rounded-2xl p-8 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-gray-400 text-sm">Sin pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((r) => (
                <ReservaCard key={r.id} r={r} showActions />
              ))}
            </div>
          )}
        </div>

        {/* Right: historial */}
        <div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3">
            Historial ({rest.length})
          </p>

          {rest.length === 0 ? (
            <div className="bg-doggo-dark2 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-sm">Sin historial aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rest.map((r) => (
                <ReservaCard key={r.id} r={r} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function ReservaCard({ r, showActions = false }: { r: Record<string, unknown>; showActions?: boolean }) {
  const s = STATUS[r.status as string] ?? { label: r.status as string, color: 'bg-gray-700 text-gray-300' }
  const date = r.reservation_date as string
  const time = r.reservation_time as string
  const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'short',
  })

  return (
    <div className={`bg-doggo-dark2 rounded-2xl p-4 ${showActions ? 'border border-doggo-yellow/30' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-white font-bold">{r.customer_name as string}</p>
          <p className="text-gray-400 text-sm">{r.customer_phone as string}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-300 mb-1">
        <span>📆 {dateStr}</span>
        <span>⏰ {time.slice(0, 5)}</span>
        <span>👥 {r.party_size as number} pers.</span>
      </div>
      {r.notes ? <p className="text-gray-500 text-xs mb-2">📝 {String(r.notes)}</p> : null}
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
