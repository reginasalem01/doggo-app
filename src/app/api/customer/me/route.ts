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
    .select('id, name, points')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer && user.email) {
    const { data: byEmail } = await admin
      .from('customers')
      .select('id, name, points')
      .eq('email', user.email)
      .single()
    if (byEmail) {
      await admin.from('customers').update({ auth_user_id: user.id }).eq('id', byEmail.id)
      customer = byEmail
    }
  }

  if (!customer) return NextResponse.json(null)

  // Get active rewards the customer can afford
  const today = new Date().toISOString().split('T')[0]
  const { data: rewards } = await admin
    .from('rewards')
    .select('id, name, description, points_required, expires_at, discount_type, discount_value')
    .eq('active', true)
    .lte('points_required', customer.points)
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order('points_required', { ascending: false })

  return NextResponse.json({ customer, rewards: rewards ?? [] })
}
