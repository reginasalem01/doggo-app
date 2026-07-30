import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(); if (auth) return auth
  const { id } = await params
  const admin = createAdminClient()

  const { data: customer, error } = await admin
    .from('customers')
    .select('id, name, phone, email, points, estrellas, doggo_cash')
    .eq('id', id)
    .single()

  if (error || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ customer })
}
