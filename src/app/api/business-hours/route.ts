import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Ecuador is UTC-5, no DST
const ECUADOR_OFFSET_MINUTES = -5 * 60

function getEcuadorMinutes(): number {
  const now = new Date()
  return (now.getUTCHours() * 60 + now.getUTCMinutes() + 24 * 60 + ECUADOR_OFFSET_MINUTES) % (24 * 60)
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data: rows } = await admin.from('business_settings').select('key, value')
    const s = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]))

    const ordersEnabled = s['orders_enabled'] !== 'false'
    const openTime = s['orders_open_time'] ?? '11:00'
    const closeTime = s['orders_close_time'] ?? '19:00'

    if (!ordersEnabled) {
      return NextResponse.json({ isOpen: false, openTime, closeTime, reason: 'Temporalmente cerrado' })
    }

    const nowMins = getEcuadorMinutes()
    const openMins = timeToMinutes(openTime)
    const closeMins = timeToMinutes(closeTime)
    const isOpen = nowMins >= openMins && nowMins < closeMins

    return NextResponse.json({
      isOpen,
      openTime,
      closeTime,
      reason: isOpen ? null : 'Fuera de horario',
    })
  } catch {
    // If table doesn't exist yet, default to open
    return NextResponse.json({ isOpen: true, openTime: '11:00', closeTime: '19:00', reason: null })
  }
}
