import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data } = await admin
    .from('orders')
    .select('id, status, total, customer_name, delivery_type, created_at')
    .eq('id', id)
    .single()

  if (!data) return NextResponse.json(null, { status: 404 })

  return NextResponse.json(data)
}
