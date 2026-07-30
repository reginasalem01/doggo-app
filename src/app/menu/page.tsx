import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MenuClient from './MenuClient'
import type { Category, Product } from '@/types'

export const metadata: Metadata = {
  title: 'Menú · Doggo',
  description: 'Explora nuestro menú de hot dogs, bebidas y más. Pide en línea y recibe en tu mesa o a domicilio.',
}

// Ecuador UTC-5
function getEcuadorMinutes(): number {
  const now = new Date()
  return (now.getUTCHours() * 60 + now.getUTCMinutes() + 24 * 60 + (-5 * 60)) % (24 * 60)
}
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default async function MenuPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const [{ data: categories }, { data: products }, { data: settingsRows }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('products').select('*').eq('available', true).order('sort_order'),
    admin.from('business_settings').select('key, value').catch(() => ({ data: null })),
  ])

  const s = Object.fromEntries(((settingsRows ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]))
  const ordersEnabled = s['orders_enabled'] !== 'false'
  const openTime = s['orders_open_time'] ?? '11:00'
  const closeTime = s['orders_close_time'] ?? '19:00'
  const nowMins = getEcuadorMinutes()
  const isOpen = ordersEnabled && nowMins >= timeToMinutes(openTime) && nowMins < timeToMinutes(closeTime)
  const closedReason = !ordersEnabled
    ? 'Pedidos temporalmente suspendidos'
    : `Pedidos disponibles de ${openTime} a ${closeTime}`

  return (
    <MenuClient
      categories={(categories ?? []) as Category[]}
      products={(products ?? []) as Product[]}
      isOpen={isOpen}
      closedReason={closedReason}
      openTime={openTime}
      closeTime={closeTime}
    />
  )
}
