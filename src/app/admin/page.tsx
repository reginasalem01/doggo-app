export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import RealtimeKanban from './pedidos/RealtimeKanban'

export const revalidate = 0

export default async function AdminPage() {
  const admin = createAdminClient()

  const { data: orders } = await admin
    .from('orders')
    .select('*, order_items(product_name, quantity, notes, customizations)')
    .in('status', ['new', 'accepted', 'preparing', 'ready'])
    .order('created_at', { ascending: true })

  return (
    <div className="h-full flex flex-col">
      <RealtimeKanban initialOrders={orders ?? []} />
    </div>
  )
}
