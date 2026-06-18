import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const { customerId, rewardId } = await req.json()

  if (!customerId || !rewardId) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get reward
  const { data: reward, error: rewardError } = await admin
    .from('rewards')
    .select('id, name, points_required, active')
    .eq('id', rewardId)
    .single()

  if (rewardError || !reward || !reward.active) {
    return NextResponse.json({ error: 'Premio no válido' }, { status: 404 })
  }

  // Get customer
  const { data: customer, error: customerError } = await admin
    .from('customers')
    .select('id, points')
    .eq('id', customerId)
    .single()

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  if (customer.points < reward.points_required) {
    return NextResponse.json({ error: 'Puntos insuficientes' }, { status: 400 })
  }

  const newPoints = customer.points - reward.points_required

  // Deduct points
  const { error: updateError } = await admin
    .from('customers')
    .update({ points: newPoints })
    .eq('id', customerId)

  if (updateError) {
    return NextResponse.json({ error: 'Error al canjear' }, { status: 500 })
  }

  // Log transaction
  await admin.from('loyalty_transactions').insert({
    customer_id: customerId,
    points: -reward.points_required,
    type: 'redeem',
    description: `Canje: ${reward.name}`,
  })

  return NextResponse.json({ success: true, newPoints, reward: reward.name })
}
