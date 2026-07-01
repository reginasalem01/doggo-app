import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DATAFAST_BASE_URL = process.env.DATAFAST_BASE_URL ?? 'https://test.oppwa.com'
const ENTITY_ID = process.env.DATAFAST_ENTITY_ID ?? '8a829418533cf31d01533d06f2ee06fa'
const BEARER = process.env.DATAFAST_BEARER_TOKEN ?? 'OGE4Mjk0MTg1MzNjZjMxZDAxNTMzZDA2ZmQwNDA3NDh8WHQ3RjIyUUVOWA=='

// IVA Ecuador 15% (inclusive en el precio)
function calcIva(total: number) {
  const base_imp = Math.round((total / 1.15) * 100) / 100
  const iva      = Math.round((total - base_imp) * 100) / 100
  return { base_imp, iva, base0: 0 }
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })

    const admin = createAdminClient()

    // Verificar que el pedido existe y aún está pendiente de pago
    const { data: order } = await admin
      .from('orders')
      .select('id, total, customer_name, customer_email, customer_phone, delivery_type, address, payment_status, order_items(product_name, quantity, unit_price, total)')
      .eq('id', orderId)
      .single()

    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Este pedido ya fue pagado' }, { status: 400 })
    }

    // IP del cliente para prevención de fraude
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'

    const total = Number(order.total)
    const { base_imp, iva, base0 } = calcIva(total)

    // Nombre del cliente
    const nameParts = order.customer_name.trim().split(' ')
    const firstName = nameParts[0] ?? 'Cliente'
    const lastName  = nameParts.slice(1).join(' ') || 'Doggo'

    // merchantTransactionId: único por pedido (8-255 chars alfanum)
    const merchantTxId = `doggo_${orderId.replace(/-/g, '').slice(0, 20)}`

    // Construir params del formulario
    const params = new URLSearchParams({
      entityId:    ENTITY_ID,
      amount:      total.toFixed(2),
      currency:    'USD',
      paymentType: 'DB',

      // Datos del cliente
      'customer.givenName':              firstName.slice(0, 48),
      'customer.surname':                lastName.slice(0, 48),
      'customer.email':                  order.customer_email ?? `pedido@doggo.com.ec`,
      'customer.ip':                     clientIp,
      'customer.merchantCustomerId':     orderId.slice(0, 16),
      'customer.phone':                  (order.customer_phone ?? '0999000000').slice(0, 25),
      'customer.identificationDocType':  'IDCARD',
      'customer.identificationDocId':    '9999999999', // placeholder — actualizar si se recolecta cédula

      // ID único de transacción
      merchantTransactionId: merchantTxId,

      // Dirección de facturación y entrega
      'billing.street1':  (order.address ?? 'Plaza Guayarte').slice(0, 100),
      'billing.country':  'EC',
      'billing.postcode': '090101',
      'shipping.street1': (order.address ?? 'Plaza Guayarte').slice(0, 100),
      'shipping.country': 'EC',

      // Impuestos (IVA 15%, incluido en el precio)
      'customParameters[SHOPPER_VAL_BASE0]':   base0.toFixed(2),
      'customParameters[SHOPPER_VAL_BASEIMP]': base_imp.toFixed(2),
      'customParameters[SHOPPER_VAL_IVA]':     iva.toFixed(2),
      'customParameters[SHOPPER_VERSIONDF]':   '2',
      'risk.parameters[USER_DATA2]':           'Doggo',
    })

    // Phase 2: agregar MID/TID/ECI/PSERV si están configurados
    if (process.env.DATAFAST_MID) {
      params.set('risk.parameters[SHOPPER_MID]',    process.env.DATAFAST_MID)
      params.set('customParameters[SHOPPER_TID]',   process.env.DATAFAST_TID ?? '')
      params.set('customParameters[SHOPPER_ECI]',   process.env.DATAFAST_ECI ?? '')
      params.set('customParameters[SHOPPER_PSERV]', process.env.DATAFAST_PSERV ?? '')
    }

    // Test mode (Phase 2 sandbox solamente)
    if (process.env.DATAFAST_TEST_MODE) {
      params.set('testMode', process.env.DATAFAST_TEST_MODE)
    }

    // Items del carrito
    const items = order.order_items as { product_name: string; quantity: number; unit_price: number }[]
    items.forEach((item, i) => {
      params.set(`cart.items[${i}].name`,        item.product_name.slice(0, 255))
      params.set(`cart.items[${i}].description`, item.product_name.slice(0, 255))
      params.set(`cart.items[${i}].price`,       Number(item.unit_price).toFixed(2))
      params.set(`cart.items[${i}].quantity`,    String(item.quantity))
    })

    // Llamar a Datafast para crear sesión de checkout
    const res = await fetch(`${DATAFAST_BASE_URL}/v1/checkouts`, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${BEARER}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const json = await res.json() as { id?: string; result?: { code?: string; description?: string } }

    if (!json.id) {
      console.error('[Datafast] checkout creation failed:', json)
      return NextResponse.json({ error: 'Error iniciando sesión de pago' }, { status: 502 })
    }

    // Guardar registro en tabla payments
    await admin.from('payments').upsert(
      {
        order_id:           orderId,
        provider:           'datafast',
        provider_reference: json.id,
        amount:             total,
        status:             'pending',
      },
      { onConflict: 'order_id' }
    )

    return NextResponse.json({ checkoutId: json.id, total })
  } catch (err) {
    console.error('[payments/create] error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
