import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, ORDER_STATUS_LABELS, DELIVERY_LABELS } from '@/lib/utils'
import type { Order, OrderItem } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PedidoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)

  if (!order) {
    return (
      <div className="min-h-screen bg-doggo-dark flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">😕</span>
        <p className="text-white font-bold text-lg">Pedido no encontrado</p>
        <Link href="/" className="bg-doggo-yellow text-doggo-dark font-bold px-6 py-3 rounded-full">
          Ir al inicio
        </Link>
      </div>
    )
  }

  const o = order as Order
  const shortId = o.id.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen bg-doggo-dark px-4 py-6">
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-white text-2xl font-black">¡Pedido enviado!</h1>
        <p className="text-gray-400 text-sm mt-1">#{shortId}</p>
      </div>

      {/* Status */}
      <div className="bg-doggo-dark2 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Estado</span>
          <span className="bg-doggo-yellow text-doggo-dark text-xs font-black px-3 py-1 rounded-full">
            {ORDER_STATUS_LABELS[o.status] ?? o.status}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-400 text-sm">Tipo</span>
          <span className="text-white text-sm font-semibold">
            {DELIVERY_LABELS[o.delivery_type] ?? o.delivery_type}
          </span>
        </div>
        {o.address && (
          <div className="mt-2">
            <span className="text-gray-400 text-sm block">Dirección</span>
            <span className="text-white text-sm">{o.address}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-doggo-dark2 rounded-2xl p-4 mb-4">
        <p className="text-white font-bold text-sm mb-3">Tu pedido</p>
        {(items as OrderItem[])?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">{item.quantity}× {item.product_name}</span>
            <span className="text-white">{formatPrice(item.total)}</span>
          </div>
        ))}
        {o.notes && (
          <p className="text-gray-500 text-xs mt-2 pt-2 border-t border-doggo-dark3">
            📝 {o.notes}
          </p>
        )}
        <div className="border-t border-doggo-dark3 mt-3 pt-3 flex justify-between font-black">
          <span className="text-white">Total</span>
          <span className="text-doggo-yellow">{formatPrice(o.total)}</span>
        </div>
      </div>

      {/* WhatsApp info */}
      <div className="bg-doggo-dark2 rounded-2xl p-4 mb-6">
        <p className="text-white text-sm font-bold mb-1">📱 Confirmación por WhatsApp</p>
        <p className="text-gray-400 text-xs">
          Ya avisamos al local por WhatsApp. Te contactarán si tienen alguna pregunta.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          href="/menu"
          className="block w-full bg-doggo-yellow text-doggo-dark text-center font-black py-4 rounded-full"
        >
          Seguir ordenando
        </Link>
        <Link
          href="/"
          className="block w-full text-center text-gray-400 text-sm py-2"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
