'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReservationActions({
  reservationId,
  customerPhone,
  customerName,
  date,
  time,
}: {
  reservationId: string
  customerPhone: string
  customerName: string
  date: string
  time: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: 'confirmed' | 'cancelled') {
    setLoading(true)
    await fetch(`/api/admin/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (status === 'confirmed') {
      const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('es-EC', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
      const msg = encodeURIComponent(
        `Hola ${customerName} 👋, tu reserva en Doggo ha sido *confirmada* ✅\n📆 ${dateStr} a las ${time.slice(0, 5)}\n¡Te esperamos! 🌭`
      )
      window.open(`https://wa.me/593${customerPhone.replace(/^0/, '')}?text=${msg}`, '_blank')
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2 mt-1">
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
  )
}