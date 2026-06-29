import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function GET() {
  const auth = await requireRole(); if (auth) return auth
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
