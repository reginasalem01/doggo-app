import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(); if (auth) return auth
  const { id } = await params
  const admin = createAdminClient()

  const { data: customer, error } = await admin
    .from('customers')
    .select('id, name, phone, email, points')
    .eq('id', id)
    .single()

  if (error || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  // Fetch active rewards they can redeem
  const { data: rewards } = await admin
    .from('rewards')
    .select('id, name, description, points_required, discount_type, discount_value')
    .eq('active', true)
    .lte('points_required', customer.points)
    .order('points_required', { ascending: false })

  return NextResponse.json({ customer, rewards: rewards ?? [] })
}
