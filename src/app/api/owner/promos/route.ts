import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function POST(request: Request) {
  const auth = await requireRole('owner'); if (auth) return auth
  const body = await request.json()
  const admin = createAdminClient()
  const { data, error } = await admin.from('promotions').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
