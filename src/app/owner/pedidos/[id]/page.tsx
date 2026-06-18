import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DELIVERY_LABELS } from '@/lib/utils'

const STATUS: Record<string, { label: string; color: string }> = {
  new:       { label: 'Nuevo',      color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  accepted:  { label: 'Aceptado',   color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  preparing: { label: 'Preparando', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  ready:     { label: 'Listo',      color: 'bg-green-100 text-green-700 border border-green-200' },
  delivered: { label: 'Entregado',  color: 'bg-gray-100 text-gray-600 border border-gray-200' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-100 text-red-600 border border-red-200' },
}

export default async function OwnerPedidoDetailPage({
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

  const s = STATUS[order.status] ?? { label: order.status, color: 'bg-gray-700 text-gray-300' }
  const shortId = (order.id as string).slice(0, 8).toUpperCase()
  const date = new Date(order.created_at as string)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/pedidos" className="text-gray-500 hover:text-gray-900 text-sm">← Pedidos</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-gray-900 text-xl font-black">Pedido #{shortId}</h1>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.color}`}>{s.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Date */}
          <div className="bg-gray-50 rounded-2xl px-5 py-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Fecha y hora</p>
            <p className="text-gray-900 font-semibold">
              {date.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-gray-500 text-sm">
              {date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Customer */}
          <div className="bg-gray-50 rounded-2xl px-5 py-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Cliente</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Nombre</span>
                <span className="text-gray-900 font-semibold text-sm">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Teléfono</span>
                <span className="text-gray-900 text-sm">{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Email</span>
                  <span className="text-gray-900 text-sm">{order.customer_email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Entrega</span>
                <span className="text-gray-900 text-sm">{DELIVERY_LABELS[order.delivery_type as string] ?? order.delivery_type}</span>
              </div>
              {order.address && (
                <div className="flex justify-between gap-6">
                  <span className="text-gray-500 text-sm shrink-0">Dirección</span>
                  <span className="text-gray-900 text-sm text-right">{order.address}</span>
                </div>
              )}
              {order.notes && (
                <div className="flex justify-between gap-6">
                  <span className="text-gray-500 text-sm shrink-0">Notas</span>
                  <span className="text-gray-900 text-sm text-right">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Items */}
          <div className="bg-gray-50 rounded-2xl px-5 py-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Productos</p>
            <div className="space-y-3">
              {(order.order_items as Array<{
                id: string; quantity: number; product_name: string;
                unit_price: number; total: number; notes?: string
              }>)?.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-900 text-sm font-semibold">{item.quantity}× {item.product_name}</p>
                    {item.notes && <p className="text-gray-500 text-xs">{item.notes}</p>}
                    <p className="text-gray-500 text-xs">${Number(item.unit_price).toFixed(2)} c/u</p>
                  </div>
                  <p className="text-gray-900 font-bold ml-4">${Number(item.total).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 mt-4 pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Envío</span>
                  <span className="text-gray-900">${Number(order.delivery_fee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-lg">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-gray-50 rounded-2xl px-5 py-4 flex justify-between items-center">
            <p className="text-gray-500 text-sm">Estado del pago</p>
            <span className={`font-bold text-sm ${order.payment_status === 'paid' ? 'text-green-700' : order.payment_status === 'failed' ? 'text-red-600' : 'text-yellow-700'}`}>
              {order.payment_status === 'paid' ? '✅ Pagado' : order.payment_status === 'failed' ? '❌ Fallido' : '⏳ Pendiente'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
