import { createAdminClient } from '@/lib/supabase/admin'
import { resend } from '@/lib/resend'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth-guard'

const VALID_STATUSES = ['new', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(); if (auth) return auth
  const { id } = await params
  const { status } = await request.json()

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }
  const admin = createAdminClient()

  // Get order before updating (to check previous status)
  const { data: order } = await admin
    .from('orders')
    .select('status, total, customer_name, customer_email, delivery_type, address, points_awarded, order_items(product_name, quantity)')
    .eq('id', id)
    .single()

  const { error } = await admin
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enviar email de confirmación cuando el admin acepta el pedido
  if (status === 'preparing' && order?.status === 'new' && order?.customer_email) {
    const shortId = '#' + id.slice(0, 4).toUpperCase()
    const items = (order.order_items as { product_name: string; quantity: number }[]) ?? []
    const itemsHtml = items
      .map((i) => `<tr><td style="padding:4px 0;color:#555">${i.product_name}</td><td style="padding:4px 0;color:#555;text-align:right">x${i.quantity}</td></tr>`)
      .join('')
    const deliveryLabel =
      order.delivery_type === 'delivery' ? '🛵 Domicilio' :
      order.delivery_type === 'pickup' ? '🏃 Retiro en local' : '🪑 Consumo en local'

    await resend.emails.send({
      from: 'Doggo <noreply@doggo.com.ec>',
      to: order.customer_email,
      subject: `✅ Tu pedido ${shortId} fue aceptado`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <div style="background:#FFDD00;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
            <img src="https://khcrenvrlfhyojbzvyyr.supabase.co/storage/v1/object/public/images/brand/LOGO%20CIRCULAR%20SIN%20FONDO.png" alt="Doggo" width="100" height="100" style="display:block;margin:0 auto 12px" />
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

  // Auto-award points when order is delivered (only once, using points_awarded flag)
  if (status === 'delivered' && !order?.points_awarded && order?.customer_email) {
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
          admin.from('orders').update({ points_awarded: true }).eq('id', id),
        ])
      }
    }
  }

  return NextResponse.json({ ok: true })
}
