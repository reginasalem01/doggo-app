export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

function tier(estrellas: number) {
  if (estrellas >= 26) return { label: 'Oro', color: 'text-yellow-600 bg-yellow-50', emoji: '🥇' }
  if (estrellas >= 11) return { label: 'Plata', color: 'text-gray-500 bg-gray-100', emoji: '🥈' }
  return { label: 'Bronce', color: 'text-orange-700 bg-orange-50', emoji: '🥉' }
}

export default async function OwnerFidelizacionPage() {
  const admin = createAdminClient()

  const [
    { data: customers },
    { data: rewards },
    { data: redemptions },
    { data: transactions },
  ] = await Promise.all([
    admin
      .from('customers')
      .select('id, name, email, phone, estrellas, doggo_cash, created_at')
      .order('estrellas', { ascending: false }),
    admin.from('rewards').select('*').order('points_required', { ascending: true }),
    admin
      .from('reward_redemptions')
      .select('*, customers(name, email), rewards(name)')
      .order('created_at', { ascending: false })
      .limit(30),
    admin
      .from('loyalty_transactions')
      .select('*, customers(name)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalCustomers = customers?.length ?? 0
  const totalEstrellas = customers?.reduce((s, c) => s + (c.estrellas ?? 0), 0) ?? 0
  const totalDoggoCirculation = customers?.reduce((s, c) => s + Number(c.doggo_cash ?? 0), 0) ?? 0
  const activeCustomers = customers?.filter((c) => (c.estrellas ?? 0) > 0).length ?? 0

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-gray-900 text-2xl font-black">Fidelización</h1>
        <Link
          href="/owner/fidelizacion/nuevo"
          className="bg-doggo-yellow text-doggo-dark font-black px-4 py-2 rounded-full text-sm"
        >
          + Premio
        </Link>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Clientes registrados', value: totalCustomers, sub: `${activeCustomers} con estrellas` },
          { label: 'Total estrellas ⭐', value: totalEstrellas.toLocaleString(), sub: 'ganadas históricamente' },
          { label: 'Doggo Cash activo', value: `$${totalDoggoCirculation.toFixed(2)}`, sub: 'en circulación' },
          { label: 'Premios activos', value: rewards?.filter((r) => r.active).length ?? 0, sub: 'disponibles para canjear' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-gray-900 text-2xl font-black">{s.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Clientes ─────────────────────────────────────────────── */}
      <section>
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
          Clientes ({totalCustomers})
        </p>
        {!customers?.length ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">Aún no hay clientes registrados</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Cliente', 'Nivel', 'Estrellas ⭐', 'Doggo Cash 💵', 'Desde'].map((h) => (
                      <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const t = tier(c.estrellas ?? 0)
                    return (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-gray-900 text-sm font-semibold">{c.name}</p>
                          <p className="text-gray-400 text-xs">{c.email ?? c.phone ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.color}`}>
                            {t.emoji} {t.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-black text-sm">
                          {c.estrellas ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold text-sm ${Number(c.doggo_cash) > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                            ${Number(c.doggo_cash ?? 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
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
      </section>

      {/* ── Transacciones recientes ───────────────────────────────── */}
      <section>
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
          Transacciones recientes ({transactions?.length ?? 0})
        </p>
        {!transactions?.length ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">Aún no hay transacciones</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Cliente', 'Descripción', 'Estrellas', 'Doggo Cash', 'Fecha'].map((h) => (
                      <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const customer = tx.customers as { name: string } | null
                    const isEarned = tx.type === 'earned'
                    const cashAmt = Number(tx.doggo_cash_amount ?? 0)
                    return (
                      <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                        <td className="px-5 py-2.5 text-gray-900 text-sm font-semibold">
                          {customer?.name ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[220px] truncate">
                          {tx.description ?? tx.type}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-sm font-black ${isEarned ? 'text-green-700' : 'text-red-400'}`}>
                            {isEarned ? '+' : ''}{tx.points ?? 0} ⭐
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {cashAmt !== 0 && (
                            <span className={`text-sm font-bold ${cashAmt > 0 ? 'text-green-700' : 'text-red-400'}`}>
                              {cashAmt > 0 ? '+' : ''}${cashAmt.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                          {' '}
                          {new Date(tx.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Canjes ───────────────────────────────────────────────── */}
      <section>
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
          Canjes ({redemptions?.length ?? 0})
        </p>
        {!redemptions?.length ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">Aún no hay canjes</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Cliente', 'Premio', 'Estrellas usadas', 'Estado', 'Fecha'].map((h) => (
                      <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((rd) => {
                    const customer = rd.customers as { name: string; email: string } | null
                    const reward = rd.rewards as { name: string } | null
                    return (
                      <tr key={rd.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                        <td className="px-5 py-2.5">
                          <p className="text-gray-900 text-sm font-semibold">{customer?.name ?? '—'}</p>
                          <p className="text-gray-400 text-xs">{customer?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-2.5 text-gray-700 text-sm">{reward?.name ?? '—'}</td>
                        <td className="px-4 py-2.5 text-doggo-red font-black text-sm">
                          -{rd.points_used} ⭐
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            rd.status === 'approved' ? 'bg-green-50 text-green-700'
                            : rd.status === 'rejected' ? 'bg-red-50 text-red-500'
                            : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {rd.status === 'approved' ? '✅ Aprobado'
                             : rd.status === 'rejected' ? '❌ Rechazado'
                             : '⏳ Pendiente'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(rd.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Premios ───────────────────────────────────────────────── */}
      <section>
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
          Premios ({rewards?.length ?? 0})
        </p>
        {!rewards?.length ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">No hay premios creados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rewards.map((r) => {
              const isExpired = r.expires_at && new Date(r.expires_at) < new Date()
              const expires = r.expires_at
                ? new Date(r.expires_at + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
                : null
              return (
                <Link
                  key={r.id}
                  href={`/owner/fidelizacion/${r.id}`}
                  className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-gray-900 font-semibold truncate">{r.name}</p>
                      {isExpired && (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full shrink-0">Vencido</span>
                      )}
                    </div>
                    {r.description && <p className="text-gray-500 text-xs truncate">{r.description}</p>}
                    {expires && <p className="text-gray-400 text-xs mt-0.5">Vence: {expires}</p>}
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-doggo-red font-black text-sm">{r.points_required} ⭐</p>
                    <span className={`text-xs ${r.active && !isExpired ? 'text-green-700' : 'text-gray-400'}`}>
                      {r.active && !isExpired ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
