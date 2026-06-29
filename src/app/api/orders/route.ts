import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order, items, reward_id, customer_id } = body

    if (!order || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const admin = createAdminClient()

    // ── Recalcular precios desde BD (no confiar en el cliente) ──────────────────
    const productIds = items.map((i: { product_id: string }) => i.product_id)
    const { data: products, error: productsError } = await admin
      .from('products')
      .select('id, price, name, available')
      .in('id', productIds)

    if (productsError || !products?.length) {
      return NextResponse.json({ error: 'Productos no encontrados' }, { status: 400 })
    }

    const priceMap = Object.fromEntries(products.map((p) => [p.id, p]))

    // Verificar disponibilidad y calcular totales reales
    const verifiedItems = []
    let serverSubtotal = 0
    for (const item of items) {
      const product = priceMap[item.product_id]
      if (!product) return NextResponse.json({ error: `Producto no encontrado: ${item.product_id}` }, { status: 400 })
      if (!product.available) return NextResponse.json({ error: `"${product.name}" ya no está disponible` }, { status: 400 })
      const itemTotal = Math.round(product.price * item.quantity * 100) / 100
      serverSubtotal += itemTotal
      verifiedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        total: itemTotal,
        notes: item.notes ?? null,
      })
    }
    serverSubtotal = Math.round(serverSubtotal * 100) / 100

    // Delivery fee: fijo según tipo de entrega
    const deliveryFee = order.delivery_type === 'delivery' ? 1.5 : 0

    // ── Verificar y canjear reward atómicamente (evita race condition) ──────────
    let rewardName: string | null = null
    let rewardPointsRequired = 0
    let discountAmount = 0

    if (reward_id && customer_id) {
      // Verificar que el customer_id pertenece al usuario autenticado
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: ownCustomer } = await admin
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
        if (!ownCustomer || ownCustomer.id !== customer_id) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }
      }

      const { data: redeemResult, error: redeemError } = await admin
        .rpc('redeem_reward_atomic', { p_customer_id: customer_id, p_reward_id: reward_id })

      if (redeemError || !redeemResult) {
        return NextResponse.json({ error: 'Error al procesar el premio' }, { status: 500 })
      }

      if (redeemResult.error) {
        return NextResponse.json({ error: redeemResult.error }, { status: 400 })
      }

      rewardName = redeemResult.reward_name
      rewardPointsRequired = redeemResult.points_required

      if (redeemResult.discount_type === 'percentage' && redeemResult.discount_value) {
        discountAmount = Math.round((serverSubtotal * redeemResult.discount_value) / 100 * 100) / 100
      } else if (redeemResult.discount_type === 'fixed' && redeemResult.discount_value) {
        discountAmount = Math.min(redeemResult.discount_value, serverSubtotal)
      }
    }

    // Total final calculado en el servidor
    const serverTotal = Math.round((serverSubtotal + deliveryFee - discountAmount) * 100) / 100

    // Construir orderData con campos explícitos (nunca confiar en el spread del cliente)
    const notes = rewardName
      ? (order.notes ? `${order.notes} | 🎁 Premio: ${rewardName}` : `🎁 Premio: ${rewardName}`)
      : (order.notes ?? null)

    const orderData = {
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email ?? null,
      delivery_type: order.delivery_type,
      address: order.address ?? null,
      notes,
      lat: order.lat ?? null,
      lng: order.lng ?? null,
      subtotal: serverSubtotal,
      delivery_fee: deliveryFee,
      total: serverTotal,
      status: 'new',
      payment_status: 'pending',
      points_awarded: false,
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

    // Create order items (con precios verificados)
    const orderItems = verifiedItems.map((item) => ({ ...item, order_id: newOrder.id }))

    const { error: itemsError } = await admin.from('order_items').insert(orderItems)

    if (itemsError) {
      await admin.from('orders').delete().eq('id', newOrder.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Log redemption transaction
    if (reward_id && customer_id && rewardName && rewardPointsRequired > 0) {
      await Promise.all([
        admin.from('reward_redemptions').insert({
          customer_id,
          reward_id,
          points_used: rewardPointsRequired,
          status: 'completed',
        }),
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
