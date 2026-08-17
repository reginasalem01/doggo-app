import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null)

  const admin = createAdminClient()

  // Get or link customer
  let { data: customer } = await admin
    .from('customers')
    .select('id, name, points, estrellas, doggo_cash, spend_accum')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer && user.email) {
    const { data: byEmail } = await admin
      .from('customers')
      .select('id, name, points, estrellas, doggo_cash, spend_accum')
      .eq('email', user.email)
      .single()
    if (byEmail) {
      await admin.from('customers').update({ auth_user_id: user.id }).eq('id', byEmail.id)
      customer = byEmail
    }
  }

  if (!customer) return NextResponse.json(null)

  return NextResponse.json({ customer })
}
