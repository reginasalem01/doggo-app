'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReservationActions({
  reservationId,
}: {
  reservationId: string
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