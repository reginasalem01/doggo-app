export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import AutoRefresher from './AutoRefresher'
import PedidosTable from './PedidosTable'

export default async function OwnerPedidosPage() {
  const admin = createAdminClient()
  const { data: orders } = await admin
    .from('orders')
    .select('id, customer_name, customer_phone, delivery_type, total, status, payment_status, payment_method, cash_amount, created_at')
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
        <PedidosTable orders={orders} />
      )}
    </div>
  )
}
