import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// PATCH /api/reservations/[id] — cliente edita o cancela su propia reserva
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // Only allow fields the client can change
  const allowed: Record<string, unknown> = {}
  if (body.reservation_date) allowed.reservation_date = body.reservation_date
  if (body.reservation_time) allowed.reservation_time = body.reservation_time
  if (body.party_size)       allowed.party_size = body.party_size
  if (body.status === 'cancelled') allowed.status = 'cancelled'

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  // Editing date/time resets to pending so staff can re-confirm
  if (allowed.reservation_date || allowed.reservation_time || allowed.party_size) {
    if (allowed.status !== 'cancelled') allowed.status = 'pending'
  }

  const admin = createAdminClient()
  const { error } = await admin.from('reservations').update(allowed).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
