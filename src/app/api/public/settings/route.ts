import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public endpoint — returns non-sensitive business settings for the customer app
export async function GET() {
  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('business_settings')
    .select('key, value')
    .in('key', ['whatsapp_number'])

  const settings = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]))
  return NextResponse.json({
    whatsapp_number: settings['whatsapp_number'] ?? '',
  })
}
