import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()
  await admin.from('categories').select('id').limit(1)
  return NextResponse.json({ ok: true })
}
