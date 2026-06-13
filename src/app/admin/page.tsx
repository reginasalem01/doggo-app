import { createAdminClient } from '@/lib/supabase/admin'
import PedidosRefresher from './pedidos/PedidosRefresher'
import KanbanBoard from './pedidos/KanbanBoard'

export const revalidate = 0   // siempre fresh desde el servidor

export default async function AdminPage() {
  const admin = createAdminClient()

  const { data: orders } = await admin
    .from('orders')
    .select('*, order_items(product_name, quantity)')
    .in('status', ['new', 'accepted', 'preparing', 'ready'])
    .order('created_at', { ascending: true })

  return (
    <div className="h-full flex flex-col">
      {/* Auto-refresh cada 30 s */}
      <PedidosRefresher />
      <KanbanBoard orders={orders ?? []} />
    </div>
  )
}
