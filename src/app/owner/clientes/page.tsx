export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

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
        <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Cliente', 'Email', 'Teléfono', 'Gastado aprox.', 'Ciclo actual', 'Doggo Cash', 'Desde'].map((h) => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-6 last:pr-6 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const initials      = c.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                  const estrellas     = c.estrellas ?? 0
                  const doggoCash     = Number(c.doggo_cash ?? 0)
                  const cycleProgress = estrellas % milestoneCount
                  const cyclesTotal   = Math.floor(estrellas / milestoneCount)
                  const totalSpent    = estrellas * spendPerHotDog

                  return (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">

                      {/* Cliente */}
                      <td className="px-6 py-3">
                        <Link href={`/owner/clientes/${c.id}`} className="flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-doggo-red/10 flex items-center justify-center shrink-0">
                            <span className="text-doggo-red font-black text-xs">{initials}</span>
                          </div>
                          <span className="text-gray-900 font-semibold text-sm group-hover:text-doggo-red transition-colors">
                            {c.name}
                          </span>
                        </Link>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-gray-500 text-sm">{c.email ?? '—'}</td>

                      {/* Teléfono */}
                      <td className="px-4 py-3 text-gray-500 text-sm">{c.phone ?? '—'}</td>

                      {/* Gastado aprox */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 font-bold text-sm">${totalSpent.toFixed(0)}</p>
                          <p className="text-gray-400 text-[10px]">{estrellas} 🌭 total</p>
                        </div>
                      </td>

                      {/* Ciclo actual */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {Array.from({ length: milestoneCount }).map((_, i) => (
                              <span key={i} className="text-xs" style={{ opacity: i < cycleProgress ? 1 : 0.2 }}>🌭</span>
                            ))}
                          </div>
                          <span className="text-gray-500 text-xs">{cycleProgress}/{milestoneCount}</span>
                        </div>
                        {cyclesTotal > 0 && (
                          <p className="text-gray-400 text-[10px] mt-0.5">{cyclesTotal} {cyclesTotal === 1 ? 'ciclo' : 'ciclos'} completados</p>
                        )}
                      </td>

                      {/* Doggo Cash */}
                      <td className="px-4 py-3">
                        <span className={`font-black text-sm ${doggoCash > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          ${doggoCash.toFixed(2)}
                        </span>
                      </td>

                      {/* Desde */}
                      <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
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
