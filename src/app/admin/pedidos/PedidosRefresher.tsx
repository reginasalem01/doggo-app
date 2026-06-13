'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PedidosRefresher() {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 30_000) // cada 30 segundos

    return () => clearInterval(interval)
  }, [router])

  return null
}
