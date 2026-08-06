import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Ecuador is UTC-5, no DST
function getEcuadorMinutes(): number {
  const now = new Date()
  return (now.getUTCHours() * 60 + now.getUTCMinutes() + 24 * 60 + (-5 * 60)) % (24 * 60)
}
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order, items, doggo_cash_used: rawDoggoUsed, customer_id } = body

    if (!order || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const admin = createAdminClient()

    // ── Verificar horario de atención ──────────────────────────────────────────
    try {
      const { data: rows } = await admin.from('business_settings').select('key, value')
      const s = Object.fromEntries((rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))
      const enabled = s['orders_enabled'] !== 'false'
      if (!enabled) {
        return NextResponse.json({ error: 'Los pedidos están temporalmente suspendidos. ¡Vuelve pronto!' }, { status: 400 })
      }
      const openTime = s['orders_open_time'] ?? '11:00'
      const closeTime = s['orders_close_time'] ?? '19:00'
      const nowMins = getEcuadorMinutes()
      if (nowMins < timeToMinutes(openTime) || nowMins >= timeToMinutes(closeTime)) {
        return NextResponse.json({
          error: `Pedidos disponibles de ${openTime} a ${closeTime} (hora Ecuador). ¡Te esperamos!`,
        }, { status: 400 })
      }
    } catch {
      // Si la tabla no existe aún, dejamos pasar
    }

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
      // Verify paid toppings extra server-side (all toppings are $1.25 each)
      const paidToppings: string[] = Array.isArray(item.customizations?.paidToppings)
        ? item.customizations.paidToppings
        : []
      const verifiedExtraPrice = parseFloat((paidToppings.length * 1.25).toFixed(2))
      const verifiedUnitPrice = parseFloat((product.price + verifiedExtraPrice).toFixed(2))
      const itemTotal = Math.round(verifiedUnitPrice * item.quantity * 100) / 100
      serverSubtotal += itemTotal

      const customizations = item.customizations
        ? {
            salsas: item.customizations.salsas ?? [],
            extras: item.customizations.extras ?? [],
            paidToppings,
            extraPrice: verifiedExtraPrice,
            notes: item.customizations.notes ?? '',
          }
        : null

      verifiedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: verifiedUnitPrice,
        total: itemTotal,
        notes: item.notes ?? null,
        customizations,
      })
    }
    serverSubtotal = Math.round(serverSubtotal * 100) / 100

    // Delivery fee: fijo según tipo de entrega
    const deliveryFee = order.delivery_type === 'delivery' ? 1.5 : 0

    // ── Doggo Cash: verificar y descontar del saldo del cliente ────────────────
    let doggoDiscount = 0
    const requestedDoggo = typeof rawDoggoUsed === 'number' && rawDoggoUsed > 0 ? rawDoggoUsed : 0

    if (requestedDoggo > 0 && customer_id) {
      // Requiere sesión activa
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Debes iniciar sesión para usar Doggo Cash' }, { status: 401 })
      }

      // Verificar que el customer_id pertenece al usuario autenticado
      const { data: cust } = await admin
        .from('customers')
        .select('id, doggo_cash')
        .eq('auth_user_id', user.id)
        .eq('id', customer_id)
        .single()

      if (!cust) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      const availableCash = Number(cust.doggo_cash)
      if (availableCash < 0.01) {
        return NextResponse.json({ error: 'No tienes saldo Doggo Cash disponible' }, { status: 400 })
      }

      // Cap: min(solicitado, saldo disponible, total bruto del pedido)
      const orderGrossTotal = Math.round((serverSubtotal + deliveryFee) * 100) / 100
      doggoDiscount = Math.min(requestedDoggo, availableCash, orderGrossTotal)
      doggoDiscount = Math.round(doggoDiscount * 100) / 100

      // Deducir del saldo del cliente
      const newBalance = Math.round((availableCash - doggoDiscount) * 100) / 100
      const { error: deductError } = await admin
        .from('customers')
        .update({ doggo_cash: newBalance })
        .eq('id', cust.id)

      if (deductError) {
        return NextResponse.json({ error: 'Error procesando Doggo Cash. Intenta de nuevo.' }, { status: 500 })
      }
    }

    // Total final calculado en el servidor
    const serverTotal = Math.max(0, Math.round((serverSubtotal + deliveryFee - doggoDiscount) * 100) / 100)

    const baseNotes = order.notes ?? null
    const notes = doggoDiscount > 0
      ? (baseNotes ? `${baseNotes} | ⭐ Doggo Cash: -$${doggoDiscount.toFixed(2)}` : `⭐ Doggo Cash: -$${doggoDiscount.toFixed(2)}`)
      : baseNotes

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
      doggo_cash_used: doggoDiscount,
      status: 'new',
      payment_status: 'pending',
      payment_method: order.payment_method ?? 'cash',
      cash_amount: order.cash_amount ?? null,
      points_awarded: false,
    }

    // Create order
    const { data: newOrder, error: orderError } = await admin
      .from('orders')
      .insert(orderData)
      .select('id')
      .single()

    if (orderError || !newOrder) {
      // Si falló la orden, restaurar el Doggo Cash al cliente
      if (doggoDiscount > 0 && customer_id) {
        const { data: currentCust } = await admin.from('customers').select('doggo_cash').eq('id', customer_id).single()
        const restoredBalance = Math.round((Number(currentCust?.doggo_cash ?? 0) + doggoDiscount) * 100) / 100
        await admin.from('customers').update({ doggo_cash: restoredBalance }).eq('id', customer_id)
      }
      return NextResponse.json({ error: orderError?.message ?? 'Error creando pedido' }, { status: 500 })
    }

    // Create order items (con precios verificados)
    const orderItems = verifiedItems.map((item) => ({ ...item, order_id: newOrder.id }))
    const { error: itemsError } = await admin.from('order_items').insert(orderItems)

    if (itemsError) {
      await admin.from('orders').delete().eq('id', newOrder.id)
      // Restaurar Doggo Cash si falló el insert de items
      if (doggoDiscount > 0 && customer_id) {
        const { data: currentCust } = await admin.from('customers').select('doggo_cash').eq('id', customer_id).single()
        const restoredBalance = Math.round((Number(currentCust?.doggo_cash ?? 0) + doggoDiscount) * 100) / 100
        await admin.from('customers').update({ doggo_cash: restoredBalance }).eq('id', customer_id)
      }
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Log transacción de canje
    if (doggoDiscount > 0 && customer_id) {
      await admin.from('loyalty_transactions').insert({
        customer_id,
        order_id: newOrder.id,
        points: 0,
        doggo_cash_amount: -doggoDiscount,
        type: 'redeemed',
        description: `⭐ Doggo Cash usado: -$${doggoDiscount.toFixed(2)}`,
      })
    }

    return NextResponse.json({ id: newOrder.id })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
