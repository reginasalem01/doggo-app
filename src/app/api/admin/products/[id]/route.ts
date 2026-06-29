import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(); if (auth) return auth
  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()
  const { error } = await admin.from('products').update(body).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(); if (auth) return auth
  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}