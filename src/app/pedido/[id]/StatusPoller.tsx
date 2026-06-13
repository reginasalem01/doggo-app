'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TERMINAL = ['delivered', 'cancelled']

export default function StatusPoller({ status }: { status: string }) {
  const router = useRouter()

  useEffect(() => {
    if (TERMINAL.includes(status)) return
    const interval = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(interval)
  }, [status, router])

  return null
}
