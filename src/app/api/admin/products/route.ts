import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function POST(request: Request) {
  const auth = await requireRole(); if (auth) return auth
  const body = await request.json()
  if (!body.name || body.price === undefined) {
    return NextResponse.json({ error: 'Nombre y precio son obligatorios' }, { status: 400 })
  }
  const admin = createAdminClient()
  const { data, error } = await admin.from('products').insert({
    name:        body.name,
    description: body.description ?? null,
    price:       body.price,
    category_id: body.category_id ?? null,
    image_url:   body.image_url ?? null,
    available:   body.available ?? true,
    sort_order:  body.sort_order ?? 0,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}