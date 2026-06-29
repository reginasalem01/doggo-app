import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/reservations?phone=0999...  OR  ?ids=id1,id2,...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const admin = createAdminClient()

  const phone = searchParams.get('phone')
  if (phone) {
    const clean = phone.replace(/\s|-/g, '')
    const alt = clean.startsWith('0') ? clean.slice(1) : '0' + clean
    const { data } = await admin
      .from('reservations')
      .select('id, customer_name, reservation_date, reservation_time, party_size, status')
      .or(`customer_phone.eq.${clean},customer_phone.eq.${alt}`)
      .order('reservation_date', { ascending: false })
      .limit(10)
    return NextResponse.json(data ?? [])
  }

  const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? []
  if (ids.length === 0) return NextResponse.json([])
  const { data, error } = await admin
    .from('reservations')
    .select('id, customer_name, reservation_date, reservation_time, party_size, status')
    .in('id', ids)

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}

const VALID_TIMES = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
]

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      customer_name,
      customer_phone,
      customer_email,
      reservation_date,
      reservation_time,
      party_size,
      notes,
    } = body

    // Validar campos requeridos
    if (!customer_name?.trim() || !customer_phone?.trim() || !reservation_date || !reservation_time || !party_size) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Validar fecha futura
    const today = new Date().toISOString().split('T')[0]
    if (reservation_date < today) {
      return NextResponse.json({ error: 'La fecha debe ser futura' }, { status: 400 })
    }

    // Validar personas
    const size = Number(party_size)
    if (!Number.isInteger(size) || size < 1 || size > 20) {
      return NextResponse.json({ error: 'Número de personas inválido (1-20)' }, { status: 400 })
    }

    // Validar hora
    const timeStr = reservation_time.slice(0, 5)
    if (!VALID_TIMES.includes(timeStr)) {
      return NextResponse.json({ error: 'Hora fuera del horario de atención' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('reservations')
      .insert({
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        customer_email: customer_email?.trim() ?? null,
        reservation_date,
        reservation_time: timeStr,
        party_size: size,
        notes: notes?.trim() ?? null,
        status: 'pending', // siempre pending, nunca permitir al cliente poner confirmed
      })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Error guardando reserva' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
