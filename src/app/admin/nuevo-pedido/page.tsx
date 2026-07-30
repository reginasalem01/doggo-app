import { createAdminClient } from '@/lib/supabase/admin'
import NuevoPedidoClient from './NuevoPedidoClient'

export default async function NuevoPedidoPage() {
  const admin = createAdminClient()
  const [{ data: categories }, { data: products }] = await Promise.all([
    admin.from('categories').select('*').order('sort_order'),
    admin.from('products').select('*').eq('available', true).order('sort_order'),
  ])

  return (
    <NuevoPedidoClient
      categories={categories ?? []}
      products={products ?? []}
    />
  )
}
