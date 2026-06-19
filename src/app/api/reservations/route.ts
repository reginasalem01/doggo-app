import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/reservations?ids=id1,id2,...  OR  ?phone=0999...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const admin = createAdminClient()

  const phone = searchParams.get('phone')
  if (phone) {
    // Look up by phone — normalize: strip leading 0, spaces, dashes
    const normalized = phone.replace(/\s|-/g, '')
    const { data } = await admin
      .from('reservations')
      .select('id, customer_name, reservation_date, reservation_time, party_size, status, notes')
      .or(`customer_phone.eq.${normalized},customer_phone.eq.0${normalized.replace(/^0/, '')}`)
      .order('reservation_date', { ascending: false })
      .limit(10)
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
