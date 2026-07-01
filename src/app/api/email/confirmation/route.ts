import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DELIVERY_LABELS: Record<string, string> = {
  delivery: '🛵 Domicilio',
  pickup:   '🏃 Retiro en local',
  dine_in:  '🪑 Consumo en local',
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { email, customerName, orderId, items, total, deliveryType, address } = await req.json()

  if (!email || !orderId) return NextResponse.json({ ok: true, skipped: true })

  // Verificar que el pedido existe y el email coincide (previene uso como spam relay)
  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('customer_email')
    .eq('id', orderId)
    .single()

  if (!order || order.customer_email !== email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const shortId = orderId.slice(0, 8).toUpperCase()

  const itemsHtml = items
    .map(
      (i: { product_name: string; quantity: number; total: number }) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;">
          ${i.product_name}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#6b7280;text-align:center;">
          ×${i.quantity}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;text-align:right;font-weight:700;">
          $${Number(i.total).toFixed(2)}
        </td>
      </tr>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header amarillo -->
        <tr>
          <td style="background:#FEC523;padding:28px 32px;text-align:center;">
            <img src="https://khcrenvrlfhyojbzvyyr.supabase.co/storage/v1/object/public/images/brand/LOGO%20CIRCULAR%20SIN%20FONDO.png" alt="Doggo" width="80" height="80" style="border-radius:50%;display:block;margin:0 auto 12px;" />
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#1a1a1a;">¡Pedido confirmado!</h1>
            <p style="margin:6px 0 0;font-size:14px;color:#1a1a1a;opacity:0.7;">Hotdog sin dramas 🌭</p>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hola, <strong style="color:#111;">${customerName}</strong></p>
            <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">Tu pedido fue recibido y ya lo estamos preparando.</p>

            <!-- ID del pedido -->
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Número de pedido</p>
              <p style="margin:0;font-size:24px;font-weight:900;color:#d62828;font-family:monospace;">#${shortId}</p>
            </div>

            <!-- Tipo de entrega -->
            <div style="margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Tipo de entrega</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#111;">${DELIVERY_LABELS[deliveryType] ?? deliveryType}</p>
              ${address ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">📍 ${address}</p>` : ''}
            </div>

            <!-- Productos -->
            <p style="margin:0 0 10px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Tu pedido</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              ${itemsHtml}
            </table>

            <!-- Total -->
            <div style="border-top:2px solid #111;padding-top:14px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:15px;font-weight:900;color:#111;">Total</span>
              <span style="font-size:20px;font-weight:900;color:#d62828;">$${Number(total).toFixed(2)}</span>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">¿Preguntas? Escríbenos por WhatsApp</p>
            <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">Plaza Guayarte · Guayaquil</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'Doggo <onboarding@resend.dev>',
      to: email,
      subject: `Tu pedido #${shortId} está confirmado 🌭`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('Resend error:', err)
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
