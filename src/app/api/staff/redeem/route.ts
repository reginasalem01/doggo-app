import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function POST(req: Request) {
  const auth = await requireRole(); if (auth) return auth
  const { customerId, rewardId } = await req.json()

  if (!customerId || !rewardId) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Canje atómico con FOR UPDATE para evitar race condition
  const { data: result, error } = await admin
    .rpc('redeem_reward_atomic', { p_customer_id: customerId, p_reward_id: rewardId })

  if (error || !result) {
    return NextResponse.json({ error: 'Error al canjear' }, { status: 500 })
  }

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Log transaction
  await admin.from('loyalty_transactions').insert({
    customer_id: customerId,
    points: -result.points_required,
    type: 'redeemed',
    description: `Canje en local: ${result.reward_name}`,
  })

  return NextResponse.json({ success: true, newPoints: result.new_points, reward: result.reward_name })
}
