'use client'

import { useEffect } from 'react'

export default function SaveReservationId({ id }: { id: string }) {
  useEffect(() => {
    if (!id) return
    try {
      const stored = JSON.parse(localStorage.getItem('doggo_reservation_ids') ?? '[]') as string[]
      if (!stored.includes(id)) {
        stored.unshift(id)
        // Keep only last 10
        localStorage.setItem('doggo_reservation_ids', JSON.stringify(stored.slice(0, 10)))
      }
    } catch {}
  }, [id])

  return null
}
