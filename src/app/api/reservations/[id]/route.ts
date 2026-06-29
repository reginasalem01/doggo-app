import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// PATCH /api/reservations/[id] — cliente cancela su propia reserva (requiere teléfono)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // Solo permitir cancelación (no edición) desde el cliente
  if (body.status !== 'cancelled') {
    return NextResponse.json({ error: 'Solo se permite cancelar' }, { status: 400 })
  }

  // Requerir teléfono para verificar propiedad (guest checkout)
  const phone = body.phone?.replace(/\s|-/g, '')
  if (!phone) {
    return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verificar que la reserva pertenece al teléfono dado
  const alt = phone.startsWith('0') ? phone.slice(1) : '0' + phone
  const { data: reservation } = await admin
    .from('reservations')
    .select('id, status, customer_phone')
    .eq('id', id)
    .single()

  if (!reservation) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  const stored = reservation.customer_phone.replace(/\s|-/g, '')
  if (stored !== phone && stored !== alt) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (reservation.status === 'cancelled') {
    return NextResponse.json({ error: 'La reserva ya está cancelada' }, { status: 400 })
  }

  const { error } = await admin
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
