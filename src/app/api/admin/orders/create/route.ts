import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function POST(request: Request) {
  const auth = await requireRole(); if (auth) return auth

  const { items, linked_customer_id, doggo_cash_used: rawDoggoUsed, payment_method } = await request.json()

  if (!items?.length) {
    return NextResponse.json({ error: 'Sin productos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Recalculate prices from DB (never trust client)
  const productIds = items.map((i: { product_id: string }) => i.product_id)
  const { data: products } = await admin
    .from('products')
    .select('id, name, price, available')
    .in('id', productIds)

  if (!products?.length) {
    return NextResponse.json({ error: 'Productos no encontrados' }, { status: 400 })
  }

  const priceMap = Object.fromEntries(products.map((p) => [p.id, p]))

  const verifiedItems = []
  let subtotal = 0
  for (const item of items) {
    const product = priceMap[item.product_id]
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 400 })
    if (!product.available) return NextResponse.json({ error: `"${product.name}" no disponible` }, { status: 400 })

    // Verify paid toppings server-side — always $1.25 each, never trust client
    const paidToppings: string[] = Array.isArray(item.customizations?.paidToppings)
      ? item.customizations.paidToppings
      : []
    const verifiedExtraPrice = parseFloat((paidToppings.length * 1.25).toFixed(2))
    const verifiedUnitPrice = parseFloat((product.price + verifiedExtraPrice).toFixed(2))
    const lineTotal = Math.round(verifiedUnitPrice * item.quantity * 100) / 100
    subtotal += lineTotal

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
      total: lineTotal,
      notes: item.customizations?.notes ?? null,
      customizations,
    })
  }
  subtotal = Math.round(subtotal * 100) / 100

  // ── Doggo Cash en caja ─────────────────────────────────────────────────────
  // Si el staff vinculó un cliente con QR y quiere aplicar su saldo
  let doggoDiscount = 0
  let linkedCustomerData: { id: string; name: string; email: string | null; phone: string | null } | null = null

  if (linked_customer_id) {
    const { data: customer } = await admin
      .from('customers')
      .select('id, name, email, phone, doggo_cash')
      .eq('id', linked_customer_id)
      .single()

    if (customer) {
      linkedCustomerData = { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone }

      const requestedDoggo = typeof rawDoggoUsed === 'number' && rawDoggoUsed > 0 ? rawDoggoUsed : 0
      if (requestedDoggo > 0) {
        const available = Number(customer.doggo_cash ?? 0)
        doggoDiscount = Math.min(requestedDoggo, available, subtotal)
        doggoDiscount = Math.round(doggoDiscount * 100) / 100

        if (doggoDiscount > 0) {
          const newBalance = Math.round((available - doggoDiscount) * 100) / 100
          await admin.from('customers').update({ doggo_cash: newBalance }).eq('id', customer.id)
        }
      }
    }
  }

  const total = Math.max(0, Math.round((subtotal - doggoDiscount) * 100) / 100)
  const notes = doggoDiscount > 0 ? `💸 Doggo Cash: -$${doggoDiscount.toFixed(2)}` : null

  // Walk-in orders: no delivery fee, dine_in, cash payment pending
  const orderData: Record<string, unknown> = {
    customer_name: linkedCustomerData?.name ?? 'Cliente en local',
    customer_phone: linkedCustomerData?.phone ?? '—',
    customer_email: linkedCustomerData?.email ?? null,
    delivery_type: 'dine_in',
    subtotal,
    delivery_fee: 0,
    total,
    doggo_cash_used: doggoDiscount,
    status: 'new',
    payment_status: payment_method === 'card' ? 'paid' : 'pending',
    points_awarded: false,
    notes,
  }

  if (linkedCustomerData) {
    orderData['linked_customer_id'] = linkedCustomerData.id
  }

  const { data: newOrder, error: orderError } = await admin
    .from('orders')
    .insert(orderData)
    .select('id')
    .single()

  if (orderError || !newOrder) {
    return NextResponse.json({ error: orderError?.message ?? 'Error creando pedido' }, { status: 500 })
  }

  const orderItems = verifiedItems.map((item) => ({ ...item, order_id: newOrder.id }))
  const { error: itemsError } = await admin.from('order_items').insert(orderItems)

  if (itemsError) {
    // Restaurar Doggo Cash si falló
    if (doggoDiscount > 0 && linked_customer_id) {
      const { data: cust } = await admin.from('customers').select('doggo_cash').eq('id', linked_customer_id).single()
      await admin.from('customers').update({ doggo_cash: (Number(cust?.doggo_cash ?? 0) + doggoDiscount) }).eq('id', linked_customer_id)
    }
    await admin.from('orders').delete().eq('id', newOrder.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Log transacción de canje Doggo Cash
  if (doggoDiscount > 0 && linked_customer_id) {
    await admin.from('loyalty_transactions').insert({
      customer_id: linked_customer_id,
      order_id: newOrder.id,
      points: 0,
      doggo_cash_amount: -doggoDiscount,
      type: 'redeemed',
      description: `💸 Doggo Cash usado en caja: -$${doggoDiscount.toFixed(2)}`,
    })
  }

  return NextResponse.json({ id: newOrder.id, doggo_cash_used: doggoDiscount })
}
