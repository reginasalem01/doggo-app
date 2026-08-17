import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function POST(req: Request) {
  const auth = await requireRole(); if (auth) return auth
  const { customerId, amount, description, invoiceRef } = await req.json()

  // Get staff user for audit trail
  const supabase = await createClient()
  const { data: { user: staffUser } } = await supabase.auth.getUser()
  const staffId = staffUser?.id ?? null

  const MAX_AMOUNT = 9999
  if (!customerId || !amount || amount <= 0 || amount > MAX_AMOUNT || !invoiceRef?.trim()) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch loyalty settings
  const { data: loyaltyRows } = await admin
    .from('business_settings')
    .select('key, value')
    .in('key', ['loyalty_spend_per_hot_dog', 'loyalty_milestone_count', 'loyalty_milestone_reward'])

  const ls = Object.fromEntries(
    (loyaltyRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )
  const spendPerHotDog  = Number(ls['loyalty_spend_per_hot_dog']  ?? 5)
  const milestoneCount  = Number(ls['loyalty_milestone_count']    ?? 5)
  const milestoneReward = Number(ls['loyalty_milestone_reward']   ?? 2.50)

  // Get current customer data
  const { data: customer, error: fetchError } = await admin
    .from('customers')
    .select('id, estrellas, doggo_cash')
    .eq('id', customerId)
    .single()

  if (fetchError || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const prevEstrellas   = customer.estrellas ?? 0
  const estrellasEarned = Math.floor(amount / spendPerHotDog)

  if (estrellasEarned === 0) {
    return NextResponse.json({ error: `Se necesita mínimo $${spendPerHotDog} para ganar un 🌭` }, { status: 400 })
  }

  const newEstrellas = prevEstrellas + estrellasEarned

  // Milestone / cycle logic
  const prevCycles      = Math.floor(prevEstrellas / milestoneCount)
  const newCycles       = Math.floor(newEstrellas  / milestoneCount)
  const cyclesCompleted = newCycles - prevCycles
  const doggoEarned     = cyclesCompleted > 0
    ? parseFloat((cyclesCompleted * milestoneReward).toFixed(2))
    : 0
  const newDoggoCash    = parseFloat((Number(customer.doggo_cash ?? 0) + doggoEarned).toFixed(2))

  // Update customer
  const { error: updateError } = await admin
    .from('customers')
    .update({ estrellas: newEstrellas, doggo_cash: newDoggoCash })
    .eq('id', customerId)

  if (updateError) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }

  // Log transaction
  const txDescription = description ?? (
    doggoEarned > 0
      ? `Compra en local · +${estrellasEarned} 🌭 · Ciclo completo: +$${doggoEarned.toFixed(2)} Doggo Cash · Ref: ${invoiceRef.trim()}`
      : `Compra en local · +${estrellasEarned} 🌭 · Ref: ${invoiceRef.trim()}`
  )

  await admin.from('loyalty_transactions').insert({
    customer_id: customerId,
    points: estrellasEarned,
    doggo_cash_amount: doggoEarned > 0 ? doggoEarned : null,
    type: 'earned',
    description: txDescription,
    staff_id: staffId,
    invoice_ref: invoiceRef?.trim() ?? null,
  })

  return NextResponse.json({ success: true, estrellasEarned, doggoEarned, newEstrellas })
}
