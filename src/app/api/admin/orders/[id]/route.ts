import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await request.json()
  const admin = createAdminClient()

  // Get order before updating (to check previous status)
  const { data: order } = await admin
    .from('orders')
    .select('status, total, customer_email, payment_status')
    .eq('id', id)
    .single()

  const { error } = await admin
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-award points when order is delivered (only once)
  if (status === 'delivered' && order?.status !== 'delivered' && order?.customer_email) {
    const { data: customer } = await admin
      .from('customers')
      .select('id, points')
      .eq('email', order.customer_email)
      .single()

    if (customer) {
      const pointsToAdd = Math.floor(Number(order.total))
      if (pointsToAdd > 0) {
        await Promise.all([
          admin.from('customers').update({
            points: customer.points + pointsToAdd,
          }).eq('id', customer.id),
          admin.from('loyalty_transactions').insert({
            customer_id: customer.id,
            order_id: id,
            points: pointsToAdd,
            type: 'earned',
            description: `Puntos por pedido · $${Number(order.total).toFixed(2)}`,
          }),
        ])
      }
    }
  }

  return NextResponse.json({ ok: true })
}
