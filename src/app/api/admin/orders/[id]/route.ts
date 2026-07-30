import { createAdminClient } from '@/lib/supabase/admin'
import { resend } from '@/lib/resend'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth-guard'
import {
  createDocument,
  isContificoConfigured,
  CONSUMIDOR_FINAL,
  type FormaCobro,
} from '@/lib/contifico'

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
    .select('status, total, customer_name, customer_email, customer_phone, delivery_type, address, points_awarded, payment_status, linked_customer_id, contifico_doc_id, order_items(product_name, quantity, unit_price)')
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
            <img src="https://rasmalxjusrwpwbtoavs.supabase.co/storage/v1/object/public/images/brand/logo-transparent.png" alt="Doggo" width="100" height="100" style="display:block;margin:0 auto 12px" />
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

  // Auto-award points when order is delivered AND paid
  // Acepta 'paid' y 'pending' (modo pago manual / en local)
  // Prioridad: linked_customer_id (pedido en local con QR) > customer_email (pedido online)
  const canAwardPoints =
    status === 'delivered' &&
    !order?.points_awarded &&
    (order?.payment_status === 'paid' || order?.payment_status === 'pending') &&
    (order?.linked_customer_id || order?.customer_email)

  if (canAwardPoints) {
    const { data: claimed, error: claimError } = await admin
      .from('orders')
      .update({ points_awarded: true })
      .eq('id', id)
      .eq('points_awarded', false) // condición atómica — solo 1 request gana
      .select('id')
      .single()

    if (!claimError && claimed) {
      // Lookup customer — linked_customer_id (from walk-in QR scan) takes priority
      let customer: { id: string; points: number } | null = null

      if (order?.linked_customer_id) {
        const { data: c } = await admin
          .from('customers')
          .select('id, points')
          .eq('id', order.linked_customer_id)
          .single()
        customer = c
      } else if (order?.customer_email) {
        const { data: c } = await admin
          .from('customers')
          .select('id, points')
          .eq('email', order.customer_email)
          .single()
        if (!c) {
          console.error(`[points] No se encontró cliente con email "${order.customer_email}" para el pedido ${id}. Puntos no otorgados.`)
        }
        customer = c
      }

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
  }

  // ── Contífico sync ──────────────────────────────────────────────────────────
  // Fires when order reaches 'delivered' and hasn't been synced yet.
  // Non-blocking: failures are logged but don't prevent the status update.
  const shouldSyncContifico =
    status === 'delivered' &&
    !order?.contifico_doc_id &&
    isContificoConfigured()

  if (shouldSyncContifico && order) {
    const productoId = process.env.CONTIFICO_PRODUCTO_GENERICO_ID!

    // Build line items from order_items; fall back to single generic line if no detail
    type OItem = { product_name: string; quantity: number; unit_price: number }
    const rawItems = (order.order_items as OItem[]) ?? []
    const detalles =
      rawItems.length > 0
        ? rawItems.map((i) => ({
            producto_id: productoId,
            nombre: i.product_name,
            cantidad: i.quantity,
            precio_unitario: Number(i.unit_price),
          }))
        : [
            {
              producto_id: productoId,
              nombre: 'Venta Doggo',
              cantidad: 1,
              precio_unitario: Number(order.total),
            },
          ]

    // Payment method heuristic: online orders are 'paid' → card; in-person → cash
    const formaCobro: FormaCobro = order.payment_status === 'paid' ? 'TC' : 'EF'

    // Customer info: use real customer if present, else consumidor final
    const cliente =
      order.customer_email && order.customer_name !== 'Cliente en local'
        ? {
            cedula: '9999999999',
            razon_social: order.customer_name.toUpperCase(),
            tipo: 'I' as const,
            email: order.customer_email,
            telefonos: order.customer_phone ?? null,
          }
        : CONSUMIDOR_FINAL

    // Atomic sequence counter stored in business_settings
    let seq = 1
    const { data: seqRow } = await admin
      .from('business_settings')
      .select('value')
      .eq('key', 'contifico_sequence')
      .single()
    seq = parseInt(seqRow?.value ?? '0', 10) + 1
    await admin.from('business_settings').upsert({ key: 'contifico_sequence', value: String(seq) })
    const now = new Date()
    const fecha = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

    createDocument(
      {
        numero: '',
        fecha,
        cliente,
        detalles,
        cobros: [{ forma_cobro: formaCobro, monto: Number(order.total) }],
        referencia: `Doggo #${id.slice(0, 8).toUpperCase()}`,
      },
      seq
    )
      .then(async (doc) => {
        await admin
          .from('orders')
          .update({ contifico_doc_id: doc.id || doc.documento })
          .eq('id', id)
        console.log(`[contifico] Factura creada: ${doc.documento} para pedido ${id}`)
      })
      .catch((err) => {
        console.error(`[contifico] Error sincronizando pedido ${id}:`, err)
      })
  }

  return NextResponse.json({ ok: true })
}
