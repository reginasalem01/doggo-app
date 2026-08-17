import { createAdminClient } from '@/lib/supabase/admin'
import { resend } from '@/lib/resend'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth-guard'

const VALID_STATUSES = ['new', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled']

// ── Doggo loyalty helpers ───────────────────────────────────────────────────
// Rates are configurable from the owner panel (business_settings table).
// Defaults: $5 = 1 🌭 · Bronce $0.50/🌭 · Plata $0.75/🌭 · Oro $1.00/🌭
async function fetchLoyaltySettings(admin: ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>) {
  const { data } = await admin
    .from('business_settings')
    .select('key, value')
    .in('key', ['loyalty_spend_per_hot_dog', 'loyalty_rate_bronce', 'loyalty_rate_plata', 'loyalty_rate_oro', 'loyalty_threshold_plata', 'loyalty_threshold_oro'])
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
  return {
    spendPerHotDog:   Number(s['loyalty_spend_per_hot_dog']  ?? 5),
    rateBronce:       Number(s['loyalty_rate_bronce']        ?? 0.50),
    ratePlata:        Number(s['loyalty_rate_plata']         ?? 0.75),
    rateOro:          Number(s['loyalty_rate_oro']           ?? 1.00),
    thresholdPlata:   Number(s['loyalty_threshold_plata']    ?? 11),
    thresholdOro:     Number(s['loyalty_threshold_oro']      ?? 26),
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(); if (auth) return auth
  const { id } = await params
  const body = await request.json()
  const { status, payment_status } = body

  // ── Payment status update (fast path — no loyalty/contifico logic) ────────
  if (payment_status && !status) {
    const VALID_PAYMENT = ['pending', 'paid', 'failed']
    if (!VALID_PAYMENT.includes(payment_status)) {
      return NextResponse.json({ error: 'Estado de pago inválido' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { error } = await admin.from('orders').update({ payment_status }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }
  const admin = createAdminClient()

  // Get order before updating (to check previous status)
  const { data: order } = await admin
    .from('orders')
    .select('status, total, customer_name, customer_email, customer_phone, delivery_type, address, points_awarded, payment_status, linked_customer_id, order_items(product_name, quantity, unit_price)')
    .eq('id', id)
    .single()

  const { error } = await admin
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enviar email de confirmación cuando el admin acepta el pedido.
  // Se dispara en dos casos:
  //   1. new → accepted  (flujo normal del Kanban)
  //   2. new → preparing  (admin se saltó accepted)
  const isFirstAcceptance =
    (status === 'accepted' && order?.status === 'new') ||
    (status === 'preparing' && order?.status === 'new')
  if (isFirstAcceptance && order?.customer_email) {
    const shortId = '#' + id.slice(0, 4).toUpperCase()
    const items = (order.order_items as { product_name: string; quantity: number }[]) ?? []
    const itemsHtml = items
      .map((i) => `<tr><td style="padding:4px 0;color:#555">${i.product_name}</td><td style="padding:4px 0;color:#555;text-align:right">x${i.quantity}</td></tr>`)
      .join('')
    const deliveryLabel =
      order.delivery_type === 'delivery' ? '🛵 Domicilio' :
      order.delivery_type === 'pickup' ? '🏃 Retiro en local' : '🪑 Consumo en local'

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Doggo <noreply@doggo.com.ec>',
      to: order.customer_email,
      subject: `✅ Tu pedido ${shortId} fue aceptado`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <div style="background:#FFDD00;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
            <img src="https://doggo.com.ec/logo-round.png" alt="Doggo" width="100" height="100" style="display:block;margin:0 auto 12px" />
            <p style="margin:0;font-size:18px;font-weight:bold">¡Pedido confirmado!</p>
          </div>

          <p style="color:#333">Hola <strong>${order.customer_name.split(' ')[0]}</strong>, tu pedido fue aceptado y ya estamos preparándolo.</p>

          <div style="background:#f9f9f9;border-radius:12px;padding:16px;margin:16px 0">
            <p style="margin:0 0 8px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Pedido ${shortId}</p>
            <table style="width:100%;border-collapse:collapse">
              ${itemsHtml}
              <tr style="border-top:1px solid #eee">
                <td style="padding:8px 0 0;font-weight:bold;color:#111">Total</td>
                <td style="padding:8px 0 0;font-weight:bold;color:#111;text-align:right">$${Number(order.total).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <p style="color:#555;margin:8px 0"><strong>Tipo:</strong> ${deliveryLabel}</p>
          ${order.address ? `<p style="color:#555;margin:8px 0"><strong>Dirección:</strong> ${order.address}</p>` : ''}

          <p style="color:#999;font-size:12px;margin-top:24px;text-align:center">Doggo — Guayaquil, Ecuador</p>
        </div>
      `,
    }).catch(() => {
      // No bloquear la respuesta si el email falla
    })
  }

  // Auto-award estrellas + Doggo Cash when order is delivered
  // Acepta 'paid' y 'pending' (pago online y en local respectivamente)
  // Prioridad: linked_customer_id (pedido en local con QR) > customer_email (pedido online)
  const canAwardEstrellas =
    status === 'delivered' &&
    !order?.points_awarded &&
    (order?.payment_status === 'paid' || order?.payment_status === 'pending') &&
    (order?.linked_customer_id || order?.customer_email)

  if (canAwardEstrellas) {
    const { data: claimed, error: claimError } = await admin
      .from('orders')
      .update({ points_awarded: true })
      .eq('id', id)
      .eq('points_awarded', false) // condición atómica — solo 1 request gana
      .select('id')
      .single()

    if (!claimError && claimed) {
      // Lookup customer — linked_customer_id (walk-in QR) takes priority
      let customer: { id: string; estrellas: number; doggo_cash: number } | null = null

      if (order?.linked_customer_id) {
        const { data: c } = await admin
          .from('customers')
          .select('id, estrellas, doggo_cash')
          .eq('id', order.linked_customer_id)
          .single()
        customer = c
      } else if (order?.customer_email) {
        const { data: c } = await admin
          .from('customers')
          .select('id, estrellas, doggo_cash')
          .eq('email', order.customer_email)
          .single()
        if (!c) {
          console.error(`[estrella] No se encontró cliente con email "${order.customer_email}" para pedido ${id}`)
        }
        customer = c
      }

      if (customer) {
        // Read loyalty rules from DB (owner-configurable)
        const loyalty = await fetchLoyaltySettings(admin)
        const estrellasEarned = Math.floor(Number(order.total) / loyalty.spendPerHotDog)
        if (estrellasEarned > 0) {
          const currentEstrellas = customer.estrellas ?? 0
          const rate = currentEstrellas >= loyalty.thresholdOro
            ? loyalty.rateOro
            : currentEstrellas >= loyalty.thresholdPlata
              ? loyalty.ratePlata
              : loyalty.rateBronce
          const doggoEarned = parseFloat((estrellasEarned * rate).toFixed(2))
          const levelLabel = currentEstrellas >= loyalty.thresholdOro ? 'Oro' : currentEstrellas >= loyalty.thresholdPlata ? 'Plata' : 'Bronce'

          await Promise.all([
            admin.from('customers').update({
              estrellas: currentEstrellas + estrellasEarned,
              doggo_cash: parseFloat(((customer.doggo_cash ?? 0) + doggoEarned).toFixed(2)),
            }).eq('id', customer.id),
            admin.from('loyalty_transactions').insert({
              customer_id: customer.id,
              order_id: id,
              points: estrellasEarned,
              doggo_cash_amount: doggoEarned,
              type: 'earned',
              description: `+${estrellasEarned} 🌭 (${levelLabel}) → +$${doggoEarned.toFixed(2)} Doggo Cash`,
            }),
          ])
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
