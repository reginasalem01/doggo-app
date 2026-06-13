import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name, phone } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = createAdminClient()

    // Check if customer already exists
    const { data: existing } = await admin
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (existing) {
      // Update phone if missing
      if (phone) {
        await admin.from('customers').update({ phone }).eq('id', existing.id)
      }
    } else {
      // Create new customer
      await admin.from('customers').insert({
        auth_user_id: user.id,
        name: name || user.email?.split('@')[0] || 'Cliente',
        email: user.email,
        phone: phone || null,
        points: 0,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
