import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function GET(request: Request) {
  void request
  const auth = await requireRole('owner'); if (auth) return auth

  const admin = createAdminClient()
  const { data: rows } = await admin.from('business_settings').select('key, value')
  const settings = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]))

  return NextResponse.json({
    orders_enabled:              settings['orders_enabled']              ?? 'true',
    orders_open_time:            settings['orders_open_time']            ?? '11:00',
    orders_close_time:           settings['orders_close_time']           ?? '19:00',
    whatsapp_number:             settings['whatsapp_number']             ?? '',
    loyalty_spend_per_hot_dog:   settings['loyalty_spend_per_hot_dog']   ?? '5',
    loyalty_milestone_count:     settings['loyalty_milestone_count']     ?? '5',
    loyalty_milestone_reward:    settings['loyalty_milestone_reward']    ?? '2.50',
  })
}

export async function PATCH(request: Request) {
  const auth = await requireRole('owner'); if (auth) return auth

  const body = await request.json()
  const allowed = [
    'orders_enabled', 'orders_open_time', 'orders_close_time', 'whatsapp_number',
    'loyalty_spend_per_hot_dog', 'loyalty_milestone_count', 'loyalty_milestone_reward',
  ]
  const updates = Object.entries(body).filter(([k]) => allowed.includes(k))

  if (!updates.length) {
    return NextResponse.json({ error: 'Sin cambios válidos' }, { status: 400 })
  }

  const admin = createAdminClient()

  await Promise.all(
    updates.map(([key, value]) =>
      admin
        .from('business_settings')
        .upsert({ key, value: String(value), updated_at: new Date().toISOString() })
    )
  )

  return NextResponse.json({ ok: true })
}
