export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import ClientesTable from './ClientesTable'

export default async function OwnerClientesPage() {
  const admin = createAdminClient()

  const [{ data: customers }, { data: loyaltyRows }] = await Promise.all([
    admin.from('customers').select('*').order('estrellas', { ascending: false }),
    admin.from('business_settings').select('key, value')
      .in('key', ['loyalty_spend_per_hot_dog', 'loyalty_milestone_count']),
  ])

  const ls = Object.fromEntries((loyaltyRows ?? []).map((r) => [r.key, r.value]))
  const spendPerHotDog = Number(ls['loyalty_spend_per_hot_dog'] ?? 5)
  const milestoneCount = Number(ls['loyalty_milestone_count']   ?? 5)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-gray-900 text-2xl font-black">Clientes</h1>
        <p className="text-gray-500 text-sm mt-0.5">{customers?.length ?? 0} registrados</p>
      </div>

      {!customers?.length ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">👤</p>
          <p className="text-gray-500">No hay clientes registrados aún</p>
        </div>
      ) : (
        <ClientesTable
          customers={customers}
          spendPerHotDog={spendPerHotDog}
          milestoneCount={milestoneCount}
        />
      )}
    </div>
  )
}
