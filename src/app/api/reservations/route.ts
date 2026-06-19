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
      .select('id, customer_name, reservation_date, reservation_time, party_size, status, notes')
      .or(`customer_phone.eq.${clean},customer_phone.eq.${alt}`)
      .order('reservation_date', { ascending: false })
      .limit(20)
    return NextResponse.json(data ?? [])
  }

  const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? []
  if (ids.length === 0) return NextResponse.json([])
  const { data, error } = await admin
    .from('reservations')
    .select('id, customer_name, reservation_date, reservation_time, party_size, status, notes')
    .in('id', ids)

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('reservations')
      .insert(body)
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
