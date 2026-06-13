import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
