export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { DELIVERY_LABELS } from '@/lib/utils'
import AutoRefresher from './AutoRefresher'

const STATUS: Record<string, { label: string; color: string }> = {
  new:       { label: 'Nuevo',      color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  accepted:  { label: 'Aceptado',   color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  preparing: { label: 'Preparando', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  ready:     { label: 'Listo',      color: 'bg-green-100 text-green-700 border border-green-200' },
  delivered: { label: 'Entregado',  color: 'bg-gray-100 text-gray-600 border border-gray-200' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-100 text-red-600 border border-red-200' },
}

export default async function OwnerPedidosPage() {
  const admin = createAdminClient()
  const { data: orders } = await admin
    .from('orders')
    .select('id, customer_name, customer_phone, delivery_type, total, status, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 text-2xl font-black">Pedidos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders?.length ?? 0} registros</p>
        </div>
        <AutoRefresher intervalMs={30000} />
      </div>

      {!orders?.length ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-500">No hay pedidos aún</p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200">
                {['ID', 'Cliente', 'Teléfono', 'Tipo', 'Estado', 'Pago', 'Total', 'Fecha'].map((h) => (
                  <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-6 last:pr-6 last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const s = STATUS[o.status] ?? { label: o.status, color: 'bg-gray-700 text-gray-300' }
                const date = new Date(o.created_at)
                return (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/owner/pedidos/${o.id}`} className="text-doggo-red font-mono text-xs font-bold hover:underline">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-900 text-sm font-medium">{o.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{o.customer_phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{DELIVERY_LABELS[o.delivery_type] ?? o.delivery_type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${o.payment_status === 'paid' ? 'text-green-700' : o.payment_status === 'failed' ? 'text-red-600' : 'text-yellow-700'}`}>
                        {o.payment_status === 'paid' ? '✅ Pagado' : o.payment_status === 'failed' ? '❌ Fallido' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-bold">${Number(o.total).toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-gray-500 text-xs whitespace-nowrap">
                      {date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                      {' '}
                      {date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
