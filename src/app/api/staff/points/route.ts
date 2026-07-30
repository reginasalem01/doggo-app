import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function POST(req: Request) {
  const auth = await requireRole(); if (auth) return auth
  const { customerId, points, description, invoiceRef } = await req.json()

  // Get staff user for audit trail
  const supabase = await createClient()
  const { data: { user: staffUser } } = await supabase.auth.getUser()
  const staffId = staffUser?.id ?? null

  const MAX_POINTS_PER_TX = 5000
  if (!customerId || !points || points <= 0 || points > MAX_POINTS_PER_TX || !Number.isInteger(points) || !invoiceRef?.trim()) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get current points
  const { data: customer, error: fetchError } = await admin
    .from('customers')
    .select('id, points')
    .eq('id', customerId)
    .single()

  if (fetchError || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const newPoints = customer.points + points

  // Update points
  const { error: updateError } = await admin
    .from('customers')
    .update({ points: newPoints })
    .eq('id', customerId)

  if (updateError) {
    return NextResponse.json({ error: 'Error al actualizar puntos' }, { status: 500 })
  }

  // Log transaction with staff audit trail
  await admin.from('loyalty_transactions').insert({
    customer_id: customerId,
    points,
    type: 'earned',
    description: description ?? 'Puntos por compra en local',
    staff_id: staffId,
    invoice_ref: invoiceRef?.trim() ?? null,
  })

  return NextResponse.json({ success: true, newPoints })
}
