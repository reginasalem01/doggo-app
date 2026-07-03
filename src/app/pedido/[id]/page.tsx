import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrice, DELIVERY_LABELS } from '@/lib/utils'
import type { Order, OrderItem } from '@/types'
import StatusPoller from './StatusPoller'

interface Props {
  params: Promise<{ id: string }>
}

const STEPS = [
  { key: 'new',       label: 'Recibido',   icon: '📋' },
  { key: 'preparing', label: 'Preparando', icon: '🍳' },
  { key: 'ready',     label: 'Listo',      icon: '🔔' },
  { key: 'delivered', label: 'Entregado',  icon: '✅' },
]

// Map actual DB statuses to step index
function stepIndex(status: string) {
  if (status === 'new')                       return 0
  if (status === 'accepted')                  return 1
  if (status === 'preparing')                 return 1
  if (status === 'ready')                     return 2
  if (status === 'delivered')                 return 3
  return 0
}

export default async function PedidoPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select('id, customer_name, delivery_type, address, notes, subtotal, delivery_fee, total, status, payment_status, created_at')
    .eq('id', id)
    .single()

  const { data: items } = await admin
    .from('order_items')
    .select('id, product_name, quantity, unit_price, total, notes')
    .eq('order_id', id)

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">😕</span>
        <p className="text-gray-900 font-bold text-lg">Pedido no encontrado</p>
        <Link href="/" className="bg-doggo-yellow text-doggo-dark font-bold px-6 py-3 rounded-full">
          Ir al inicio
        </Link>
      </div>
    )
  }

  const o       = order as Order
  const shortId = o.id.slice(0, 8).toUpperCase()
  const current = stepIndex(o.status)
  const isDelivery    = o.delivery_type === 'delivery'
  const isCancelled   = o.status === 'cancelled'
  const isDelivered   = o.status === 'delivered'
  const paymentPending = (o as Order & { payment_status: string }).payment_status === 'pending'

  // Etiqueta del paso "Listo" cambia según tipo de entrega
  const steps = STEPS.map((s, i) =>
    i === 2 && isDelivery ? { ...s, label: 'En camino', icon: '🛵' } : s
  )

  // ── Pago pendiente: mostrar resumen + botón para completar pago ──
  if (paymentPending) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 pb-24">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💳</div>
          <h1 className="text-gray-900 text-2xl font-black">Resumen del pedido</h1>
          <p className="text-gray-500 text-sm mt-1">#{shortId} · Pendiente de pago</p>
        </div>

        {/* Detalle de items */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
          <p className="text-gray-900 font-bold text-sm mb-3">Tu pedido</p>
          {(items as OrderItem[])?.map((item) => (
            <div key={item.id} className="mb-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{item.quantity}× {item.product_name}</span>
                <span className="text-gray-900">{formatPrice(item.total)}</span>
              </div>
              {item.notes && (
                <p className="text-gray-400 text-xs italic mt-0.5 pl-3">📝 {item.notes}</p>
              )}
            </div>
          ))}
          <div className="border-t border-gray-200 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatPrice(o.subtotal)}</span>
            </div>
            {o.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Envío</span>
                <span className="text-gray-900">{formatPrice(o.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-black pt-1">
              <span className="text-gray-900">Total</span>
              <span className="text-doggo-red">{formatPrice(o.total)}</span>
            </div>
          </div>
        </div>

        {/* Info entrega */}
        {(o.address || o.delivery_type) && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-200">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Tipo</span>
              <span className="text-gray-900 font-semibold">{DELIVERY_LABELS[o.delivery_type] ?? o.delivery_type}</span>
            </div>
            {o.address && (
              <div className="flex justify-between text-sm gap-4">
                <span className="text-gray-500 shrink-0">Dirección</span>
                <span className="text-gray-900 text-right">{o.address}</span>
              </div>
            )}
          </div>
        )}

        {/* CTA de pago */}
        <Link
          href={`/pago?orderId=${o.id}`}
          className="block w-full bg-doggo-yellow text-doggo-dark text-center font-black py-4 rounded-full text-base"
        >
          💳 Completar pago · {formatPrice(o.total)}
        </Link>
        <Link href="/menu" className="block w-full text-center text-gray-400 text-sm py-3 mt-1">
          Cancelar y seguir viendo el menú
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 pb-24">
      {/* Auto-refresco cada 5 s mientras no esté terminal */}
      <StatusPoller status={o.status} />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">
          {isCancelled ? '❌' : isDelivered ? '🎉' : '🌭'}
        </div>
        <h1 className="text-gray-900 text-2xl font-black">
          {isCancelled ? 'Pedido cancelado' : isDelivered ? '¡Entregado!' : '¡Pedido en camino!'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">#{shortId}</p>
      </div>

      {/* Pasos de estado */}
      {!isCancelled && (
        <div className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200">
          <div className="flex items-start justify-between relative">
            {/* Línea de progreso */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 mx-8" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-doggo-red mx-8 transition-all duration-700"
              style={{ right: `${((3 - current) / 3) * 100}%` }}
            />

            {steps.map((step, i) => {
              const done   = i < current
              const active = i === current
              return (
                <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${
                    done   ? 'bg-doggo-red'         :
                    active ? 'bg-doggo-yellow ring-4 ring-doggo-yellow/40' :
                             'bg-gray-100'
                  }`}>
                    {step.icon}
                  </div>
                  <p className={`text-xs font-bold text-center leading-tight ${
                    active ? 'text-doggo-red' : done ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Mensaje contextual */}
          <p className="text-center text-gray-500 text-xs mt-5">
            {o.status === 'new'       && 'Tu pedido fue recibido, esperando confirmación…'}
            {(o.status === 'accepted' || o.status === 'preparing') && '¡Manos a la obra! Estamos preparando tu pedido 🍳'}
            {o.status === 'ready' && !isDelivery && '¡Tu pedido está listo para retirar! 🔔'}
            {o.status === 'ready' &&  isDelivery && '¡Tu pedido está en camino! 🛵'}
            {o.status === 'delivered' && '¡Gracias por tu pedido! Buen provecho 😋'}
          </p>
        </div>
      )}

      {/* Cancelado */}
      {isCancelled && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-2xl p-4 mb-4 text-center">
          <p className="text-red-400 text-sm">Este pedido fue cancelado. Contáctanos si tienes dudas.</p>
        </div>
      )}

      {/* Detalle del pedido */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
        <p className="text-gray-900 font-bold text-sm mb-3">Tu pedido</p>
        {(items as OrderItem[])?.map((item) => (
          <div key={item.id} className="mb-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{item.quantity}× {item.product_name}</span>
              <span className="text-gray-900">{formatPrice(item.total)}</span>
            </div>
            {item.notes && (
              <p className="text-gray-400 text-xs italic mt-0.5 pl-3">📝 {item.notes}</p>
            )}
          </div>
        ))}
        {o.notes && (
          <p className="text-gray-400 text-xs mt-2 pt-2 border-t border-gray-200">
            📝 {o.notes}
          </p>
        )}
        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-black">
          <span className="text-gray-900">Total</span>
          <span className="text-doggo-red">{formatPrice(o.total)}</span>
        </div>
      </div>

      {/* Info de entrega */}
      {(o.address || o.delivery_type) && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-200">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Tipo</span>
            <span className="text-gray-900 font-semibold">{DELIVERY_LABELS[o.delivery_type] ?? o.delivery_type}</span>
          </div>
          {o.address && (
            <div className="flex justify-between text-sm gap-4">
              <span className="text-gray-500 shrink-0">Dirección</span>
              <span className="text-gray-900 text-right">{o.address}</span>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="space-y-3">
        <Link
          href="/menu"
          className="block w-full bg-doggo-yellow text-doggo-dark text-center font-black py-4 rounded-full"
        >
          Seguir ordenando
        </Link>
        <Link href="/" className="block w-full text-center text-gray-500 text-sm py-2">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
