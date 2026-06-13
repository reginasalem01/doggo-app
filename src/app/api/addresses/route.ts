import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getCustomerId(authUserId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('customers')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single()
  return data?.id ?? null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])

  const customerId = await getCustomerId(user.id)
  if (!customerId) return NextResponse.json([])

  const admin = createAdminClient()
  const { data } = await admin
    .from('addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const customerId = await getCustomerId(user.id)
  if (!customerId) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const { label, address, lat, lng } = await request.json()
  if (!address) return NextResponse.json({ error: 'Dirección requerida' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('addresses')
    .insert({ customer_id: customerId, label: label ?? 'Casa', address, lat, lng })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
