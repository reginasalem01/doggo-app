import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DATAFAST_BASE_URL = process.env.DATAFAST_BASE_URL ?? 'https://test.oppwa.com'
const ENTITY_ID = process.env.DATAFAST_ENTITY_ID ?? '8a829418533cf31d01533d06f2ee06fa'
const BEARER = process.env.DATAFAST_BEARER_TOKEN ?? 'OGE4Mjk0MTg1MzNjZjMxZDAxNTMzZDA2ZmQwNDA3NDh8WHQ3RjIyUUVOWA=='

/**
 * Códigos de aprobación Datafast:
 * 000.000.000 — producción aprobada
 * 000.100.110 — Phase 1 sandbox aprobada
 * 000.100.112 — Phase 2 sandbox aprobada (connector test)
 */
function isApproved(code: string): boolean {
  return code.startsWith('000.000.0') || code.startsWith('000.100.1')
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, resourcePath } = await req.json()

    if (!orderId || !resourcePath) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Idempotencia: si ya fue procesado, devolver resultado sin llamar a Datafast de nuevo
    const { data: existingPayment } = await admin
      .from('payments')
      .select('status, provider_reference')
      .eq('order_id', orderId)
      .single()

    if (existingPayment?.status === 'paid') {
      return NextResponse.json({ approved: true, alreadyProcessed: true })
    }

    // Verificar resultado con Datafast
    const verifyUrl = `${DATAFAST_BASE_URL}${resourcePath}?entityId=${ENTITY_ID}`
    const res = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${BEARER}` },
    })

    const result = await res.json() as {
      id?: string
      result?: { code?: string; description?: string }
      resultDetails?: { AuthCode?: string; TotalAmount?: string }
    }

    const code     = result?.result?.code ?? ''
    const approved = isApproved(code)

    if (approved) {
      // Actualizar estado del pedido
      await admin
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId)

      // Actualizar registro de pago
      await admin
        .from('payments')
        .update({
          status:             'paid',
          provider_reference: result.id ?? resourcePath,
        })
        .eq('order_id', orderId)

      // Disparar email de confirmación (fire-and-forget)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
      if (siteUrl) {
        const { data: order } = await admin
          .from('orders')
          .select('customer_email, customer_name, total, delivery_type, address, order_items(product_name, quantity, total)')
          .eq('id', orderId)
          .single()

        if (order?.customer_email) {
          fetch(`${siteUrl}/api/email/confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email:        order.customer_email,
              customerName: order.customer_name,
              orderId,
              items:        order.order_items,
              total:        order.total,
              deliveryType: order.delivery_type,
              address:      order.address,
            }),
          }).catch(() => {})
        }
      }
    } else {
      // Pago rechazado o fallido
      await admin
        .from('payments')
        .update({ status: 'failed' })
        .eq('order_id', orderId)
    }

    return NextResponse.json({
      approved,
      code,
      description: result?.result?.description ?? '',
      transactionId: result?.id ?? null,
    })
  } catch (err) {
    console.error('[payments/verify] error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
