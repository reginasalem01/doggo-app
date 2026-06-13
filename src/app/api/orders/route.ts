import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order, items, reward_id, customer_id } = body

    if (!order || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify points before creating order — store data for reuse below
    let rewardName: string | null = null
    let rewardPointsRequired = 0
    let customerCurrentPoints = 0
    let discountAmount = 0

    if (reward_id && customer_id) {
      const [{ data: customer }, { data: reward }] = await Promise.all([
        admin.from('customers').select('points').eq('id', customer_id).single(),
        admin.from('rewards').select('points_required, name, discount_type, discount_value').eq('id', reward_id).single(),
      ])
      if (!customer || !reward) {
        return NextResponse.json({ error: 'Premio o cliente no encontrado' }, { status: 400 })
      }
      if (customer.points < reward.points_required) {
        return NextResponse.json(
          { error: `No tienes suficientes puntos. Te faltan ${reward.points_required - customer.points}.` },
          { status: 400 }
        )
      }
      rewardName = reward.name
      rewardPointsRequired = reward.points_required
      customerCurrentPoints = customer.points

      // Calculate discount
      if (reward.discount_type === 'percentage' && reward.discount_value) {
        discountAmount = Math.round((order.subtotal * reward.discount_value) / 100 * 100) / 100
      } else if (reward.discount_type === 'fixed' && reward.discount_value) {
        discountAmount = Math.min(reward.discount_value, order.subtotal)
      }
    }

    // Append reward note and apply discount
    const orderData = { ...order }
    if (rewardName) {
      orderData.notes = orderData.notes
        ? `${orderData.notes} | 🎁 Premio: ${rewardName}`
        : `🎁 Premio: ${rewardName}`
      if (discountAmount > 0) {
        orderData.discount = discountAmount
        orderData.total = Math.max(0, order.total - discountAmount)
      }
    }

    // Create order
    const { data: newOrder, error: orderError } = await admin
      .from('orders')
      .insert(orderData)
      .select('id')
      .single()

    if (orderError || !newOrder) {
      return NextResponse.json({ error: orderError?.message ?? 'Error creando pedido' }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: {
      product_id: string
      product_name: string
      quantity: number
      unit_price: number
      total: number
      notes: string | null
    }) => ({ ...item, order_id: newOrder.id }))

    const { error: itemsError } = await admin.from('order_items').insert(orderItems)

    if (itemsError) {
      await admin.from('orders').delete().eq('id', newOrder.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Deduct points and log redemption — reuse data already fetched above
    if (reward_id && customer_id && rewardName && rewardPointsRequired > 0) {
      await Promise.all([
        admin.from('reward_redemptions').insert({
          customer_id,
          reward_id,
          points_used: rewardPointsRequired,
          status: 'completed',
        }),
        admin.from('customers').update({
          points: Math.max(0, customerCurrentPoints - rewardPointsRequired),
        }).eq('id', customer_id),
        admin.from('loyalty_transactions').insert({
          customer_id,
          order_id: newOrder.id,
          points: -rewardPointsRequired,
          type: 'redeemed',
          description: `Premio canjeado: ${rewardName}`,
        }),
      ])
    }

    return NextResponse.json({ id: newOrder.id })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
