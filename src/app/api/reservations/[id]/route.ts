import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const VALID_TIMES = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
]

// PATCH /api/reservations/[id]
// Permite al cliente: cancelar (status=cancelled) o editar (reservation_date/time/party_size)
// Siempre requiere teléfono para verificar propiedad
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

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

  // ── CANCELAR ──────────────────────────────────────────────────
  if (body.status === 'cancelled') {
    const { error } = await admin
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── EDITAR ────────────────────────────────────────────────────
  const { reservation_date, reservation_time, party_size } = body

  // Validar al menos un campo de edición
  if (!reservation_date && !reservation_time && !party_size) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { status: 'modified' }

  if (reservation_date) {
    const today = new Date().toISOString().split('T')[0]
    if (reservation_date < today) {
      return NextResponse.json({ error: 'La fecha debe ser futura' }, { status: 400 })
    }
    updates.reservation_date = reservation_date
  }

  if (reservation_time) {
    const timeStr = reservation_time.slice(0, 5)
    if (!VALID_TIMES.includes(timeStr)) {
      return NextResponse.json({ error: 'Hora fuera del horario de atención' }, { status: 400 })
    }
    updates.reservation_time = timeStr
  }

  if (party_size !== undefined) {
    const size = Number(party_size)
    if (!Number.isInteger(size) || size < 1 || size > 20) {
      return NextResponse.json({ error: 'Número de personas inválido (1-20)' }, { status: 400 })
    }
    updates.party_size = size
  }

  const { error } = await admin
    .from('reservations')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
