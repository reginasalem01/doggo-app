import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/supabase/auth-guard'

export async function POST(request: Request) {
  const auth = await requireRole(); if (auth) return auth

  const { items, linked_customer_id } = await request.json()

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
    const lineTotal = Math.round(product.price * item.quantity * 100) / 100
    subtotal += lineTotal
    verifiedItems.push({
      product_id: item.product_id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: product.price,
      total: lineTotal,
      notes: null,
    })
  }
  subtotal = Math.round(subtotal * 100) / 100

  // Walk-in orders: no delivery fee, dine_in, cash payment pending
  const orderData: Record<string, unknown> = {
    customer_name: 'Cliente en local',
    customer_phone: '—',
    customer_email: null,
    delivery_type: 'dine_in',
    subtotal,
    delivery_fee: 0,
    total: subtotal,
    status: 'new',
    payment_status: 'pending',
    points_awarded: false,
    notes: null,
  }

  // Link to customer account if QR was scanned
  if (linked_customer_id) {
    // Verify customer exists
    const { data: customer } = await admin
      .from('customers')
      .select('id, name, email, phone')
      .eq('id', linked_customer_id)
      .single()

    if (customer) {
      orderData['linked_customer_id'] = customer.id
      orderData['customer_name'] = customer.name
      orderData['customer_phone'] = customer.phone ?? '—'
      orderData['customer_email'] = customer.email ?? null
    }
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
    await admin.from('orders').delete().eq('id', newOrder.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ id: newOrder.id })
}
