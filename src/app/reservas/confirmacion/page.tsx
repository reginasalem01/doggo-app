import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function ReservaConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  let reserva = null
  if (id) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single()
    reserva = data
  }

  const shortId = id?.slice(0, 8).toUpperCase() ?? '—'

  const dateFormatted = reserva?.reservation_date
    ? new Date(reserva.reservation_date + 'T12:00:00').toLocaleDateString('es-EC', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'

  const timeFormatted = reserva?.reservation_time
    ? reserva.reservation_time.slice(0, 5)
    : '—'

  return (
    <div className="min-h-screen bg-doggo-dark flex flex-col">
      {/* Header */}
      <div className="bg-doggo-dark2 px-4 py-4">
        <h1 className="text-white text-xl font-black">Reserva enviada</h1>
      </div>

      <div className="flex-1 px-4 py-8 flex flex-col items-center text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-green-900/40 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">✅</span>
        </div>

        <h2 className="text-white text-2xl font-black mb-1">¡Solicitud enviada!</h2>
        <p className="text-gray-400 text-sm mb-6">
          El equipo de Doggo revisará tu solicitud y te confirmará por WhatsApp.
        </p>

        {/* Reservation summary */}
        {reserva && (
          <div className="w-full bg-doggo-dark2 rounded-2xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between items-center pb-3 border-b border-doggo-dark3">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Reserva</p>
              <p className="text-doggo-yellow font-black text-sm">#{shortId}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg">👤</span>
              <div>
                <p className="text-gray-400 text-xs">Nombre</p>
                <p className="text-white text-sm font-semibold">{reserva.customer_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg">📆</span>
              <div>
                <p className="text-gray-400 text-xs">Fecha</p>
                <p className="text-white text-sm font-semibold capitalize">{dateFormatted}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg">⏰</span>
              <div>
                <p className="text-gray-400 text-xs">Hora</p>
                <p className="text-white text-sm font-semibold">{timeFormatted}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg">👥</span>
              <div>
                <p className="text-gray-400 text-xs">Personas</p>
                <p className="text-white text-sm font-semibold">{reserva.party_size}</p>
              </div>
            </div>

            {reserva.notes && (
              <div className="flex items-start gap-3">
                <span className="text-lg">📝</span>
                <div>
                  <p className="text-gray-400 text-xs">Notas</p>
                  <p className="text-white text-sm font-semibold">{reserva.notes}</p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-doggo-dark3">
              {reserva.status === 'confirmed' ? (
                <span className="inline-flex items-center gap-1.5 bg-green-900/40 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
                  ✅ Confirmada
                </span>
              ) : reserva.status === 'cancelled' ? (
                <span className="inline-flex items-center gap-1.5 bg-red-900/40 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full">
                  ❌ Cancelada
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-yellow-900/40 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-full">
                  🕐 Pendiente de confirmación
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/reservas"
            className="w-full bg-doggo-dark2 text-white font-bold py-3 rounded-full text-sm text-center"
          >
            Hacer otra reserva
          </Link>
          <Link
            href="/"
            className="w-full bg-doggo-yellow text-doggo-dark font-black py-3 rounded-full text-sm text-center"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
