import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import PedidosRefresher from './PedidosRefresher'
import { DELIVERY_LABELS } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  new: '🆕 Nuevo',
  accepted: '✅ Aceptado',
  preparing: '👨‍🍳 Preparando',
  ready: '🔔 Listo',
  delivered: '📦 Entregado',
  cancelled: '❌ Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-doggo-yellow text-doggo-dark',
  accepted: 'bg-blue-500/20 text-blue-400',
  preparing: 'bg-orange-500/20 text-orange-400',
  ready: 'bg-green-500/20 text-green-400',
  delivered: 'bg-gray-500/20 text-gray-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

const ACTIVE_STATUSES = ['new', 'accepted', 'preparing', 'ready']

export default async function AdminPedidosPage() {
  const admin = createAdminClient()
  const { data: orders } = await admin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const activos = orders?.filter((o) => ACTIVE_STATUSES.includes(o.status)) ?? []
  const historial = orders?.filter((o) => !ACTIVE_STATUSES.includes(o.status)) ?? []

  return (
    <div className="min-h-screen bg-doggo-dark p-4 pb-10">
      {/* Auto-refresh silencioso cada 30s */}
      <PedidosRefresher />

      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-400 text-2xl leading-none">‹</Link>
        <h1 className="text-white text-2xl font-black">Pedidos</h1>
        {activos.length > 0 && (
          <span className="bg-doggo-yellow text-doggo-dark text-xs font-black px-2.5 py-1 rounded-full">
            {activos.length} activo{activos.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Activos */}
      {activos.length > 0 ? (
        <div className="mb-8">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">En curso</p>
          <div className="space-y-3">
            {activos.map((order) => (
              <OrderCard key={order.id} order={order} highlight />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-doggo-dark2 rounded-2xl p-6 text-center mb-8">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-white font-bold">Sin pedidos activos</p>
          <p className="text-gray-500 text-sm mt-1">La cocina está libre</p>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Historial reciente</p>
          <div className="space-y-2">
            {historial.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, highlight = false }: { order: Record<string, unknown>; highlight?: boolean }) {
  const status = order.status as string
  const total = Number(order.total)
  const id = order.id as string
  const customerName = order.customer_name as string
  const customerPhone = order.customer_phone as string
  const deliveryType = order.delivery_type as string
  const createdAt = order.created_at as string

  return (
    <Link
      href={`/admin/pedidos/${id}`}
      className={`block rounded-2xl p-4 ${highlight ? 'bg-doggo-dark2 border border-doggo-yellow/30' : 'bg-doggo-dark2'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-bold truncate">{customerName}</p>
          </div>
          <p className="text-gray-400 text-xs">{customerPhone} · {DELIVERY_LABELS[deliveryType] ?? deliveryType}</p>
          <p className="text-gray-600 text-xs mt-1">
            {new Date(createdAt).toLocaleString('es-EC', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-doggo-yellow font-black">${total.toFixed(2)}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-semibold ${STATUS_COLOR[status] ?? 'bg-gray-500/20 text-gray-400'}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>
      </div>
    </Link>
  )
}
