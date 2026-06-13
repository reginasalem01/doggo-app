import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import OrderStatusButtons from './OrderStatusButtons'
import { DELIVERY_LABELS } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  new:       'Nuevo',
  accepted:  'Aceptado',
  preparing: 'Preparando',
  ready:     'Listo para entrega',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  new:       'text-doggo-yellow',
  accepted:  'text-blue-400',
  preparing: 'text-orange-400',
  ready:     'text-green-400',
  delivered: 'text-gray-400',
  cancelled: 'text-red-400',
}

export default async function AdminPedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const shortId = (order.id as string).slice(0, 8).toUpperCase()
  type Item = { id: string; quantity: number; product_name: string; unit_price: number; total: number; notes?: string }
  const items = order.order_items as Item[]

  return (
    <div className="h-full flex flex-col bg-doggo-dark px-5 pt-4 pb-4 gap-2.5">

      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/admin" className="text-gray-400 hover:text-white text-2xl leading-none">‹</Link>
        <div className="flex-1">
          <h1 className="text-white text-lg font-black">Pedido #{shortId}</h1>
          <p className="text-gray-500 text-xs">
            {new Date(order.created_at as string).toLocaleString('es-EC', {
              weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`text-sm font-black ${STATUS_COLOR[order.status as string] ?? 'text-white'}`}>
          {STATUS_LABEL[order.status as string] ?? order.status}
        </span>
      </div>

      {/* Cliente */}
      <div className="bg-doggo-dark2 rounded-2xl px-4 py-3 shrink-0">
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Cliente</p>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Nombre</span>
            <span className="text-white text-sm font-semibold">{order.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Teléfono</span>
            <a href={`tel:${order.customer_phone}`} className="text-doggo-yellow text-sm font-semibold">
              {order.customer_phone}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Tipo</span>
            <span className="text-white text-sm">{DELIVERY_LABELS[order.delivery_type as string] ?? order.delivery_type}</span>
          </div>
          {order.address && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-400 text-sm shrink-0">Dirección</span>
              <span className="text-white text-sm text-right">{order.address}</span>
            </div>
          )}
          {order.lat && order.lng && (
            <a
              href={`https://maps.google.com/?q=${order.lat},${order.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-blue-900/20 border border-blue-700/30 rounded-xl px-3 py-2 hover:bg-blue-900/30 transition-colors"
            >
              <span className="text-blue-400 text-xs font-semibold">📍 Ver ubicación en Maps</span>
              <span className="text-blue-400 text-xs">›</span>
            </a>
          )}
          {order.notes && (
            <div className="bg-orange-900/20 border border-orange-700/30 rounded-xl px-3 py-1.5 mt-1">
              <p className="text-orange-300 text-xs">📝 {order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Productos */}
      <div className="bg-doggo-dark2 rounded-2xl px-4 py-3 shrink-0">
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Productos</p>
        <div className="space-y-1.5">
          {items?.map((item) => (
            <div key={item.id} className="flex justify-between items-start">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-white text-sm font-semibold">{item.quantity}× {item.product_name}</p>
                {item.notes && <p className="text-gray-500 text-xs">{item.notes}</p>}
              </div>
              <p className="text-white text-sm font-bold shrink-0">${Number(item.total).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-doggo-dark3 mt-2 pt-2 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-white">${Number(order.subtotal).toFixed(2)}</span>
          </div>
          {Number(order.delivery_fee) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Envío</span>
              <span className="text-white">${Number(order.delivery_fee).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-black">
            <span className="text-white">Total</span>
            <span className="text-doggo-yellow">${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Pago */}
      <div className="bg-doggo-dark2 rounded-2xl px-4 py-2.5 flex items-center justify-between shrink-0">
        <p className="text-gray-400 text-sm">Pago</p>
        <span className={`text-sm font-bold ${
          order.payment_status === 'paid' ? 'text-green-400'
          : order.payment_status === 'failed' ? 'text-red-400'
          : 'text-yellow-400'
        }`}>
          {order.payment_status === 'paid' ? '✅ Pagado'
           : order.payment_status === 'failed' ? '❌ Fallido'
           : '⏳ Pendiente'}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Botones */}
      <div className="shrink-0">
        <OrderStatusButtons
          orderId={order.id as string}
          currentStatus={order.status as string}
          deliveryType={order.delivery_type as string}
          customerPhone={order.customer_phone as string}
          customerName={order.customer_name as string}
          lat={order.lat as number | null}
          lng={order.lng as number | null}
          address={order.address as string | null}
        />
      </div>

    </div>
  )
}
