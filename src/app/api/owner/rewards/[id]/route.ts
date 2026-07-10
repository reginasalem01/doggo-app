import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('owner'); if (auth) return auth
  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()
  const allowed = {
    ...(body.name             !== undefined && { name: body.name }),
    ...(body.description      !== undefined && { description: body.description }),
    ...(body.points_required  !== undefined && { points_required: body.points_required }),
    ...(body.discount_type    !== undefined && { discount_type: body.discount_type }),
    ...(body.discount_value   !== undefined && { discount_value: body.discount_value }),
    ...(body.active           !== undefined && { active: body.active }),
    ...(body.expires_at       !== undefined && { expires_at: body.expires_at }),
  }
  const { data, error } = await admin.from('rewards').update(allowed).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('owner'); if (auth) return auth
  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('rewards').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
