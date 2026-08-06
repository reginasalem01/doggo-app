export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

function tierLabel(estrellas: number) {
  if (estrellas >= 26) return { label: 'Oro',    emoji: '🥇', color: 'text-yellow-600 bg-yellow-50' }
  if (estrellas >= 11) return { label: 'Plata',  emoji: '🥈', color: 'text-gray-500 bg-gray-100' }
  return                      { label: 'Bronce', emoji: '🥉', color: 'text-orange-700 bg-orange-50' }
}

type Tx = {
  id: string
  customer_id: string
  order_id: string | null
  points: number
  doggo_cash_amount: number | null
  type: string
  description: string | null
  created_at: string
  customers: { id: string; name: string } | null
}

type Redemption = {
  id: string
  customer_id: string
  reward_id: string
  points_used: number
  status: string
  created_at: string
  customers: { id: string; name: string; email: string } | null
  rewards: { name: string } | null
}

export default async function OwnerFidelizacionPage() {
  const admin = createAdminClient()

  const [
    { data: customers },
    { data: rewards },
    { data: redemptions },
    { data: transactions },
  ] = await Promise.all([
    admin.from('customers').select('id, name, email, estrellas, doggo_cash').order('estrellas', { ascending: false }),
    admin.from('rewards').select('*').order('points_required', { ascending: true }),
    admin
      .from('reward_redemptions')
      .select('*, customers(id, name, email), rewards(name)')
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('loyalty_transactions')
      .select('*, customers(id, name)')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  // ── Métricas reales ────────────────────────────────────────────────────────
  const totalCustomers   = customers?.length ?? 0
  const totalEstrellas   = customers?.reduce((s, c) => s + (c.estrellas ?? 0), 0) ?? 0
  const cashEnCirculacion = customers?.reduce((s, c) => s + Number(c.doggo_cash ?? 0), 0) ?? 0

  const txList = (transactions ?? []) as Tx[]
  const cashEmitido  = txList.filter(t => t.type === 'earned' && Number(t.doggo_cash_amount ?? 0) > 0)
                             .reduce((s, t) => s + Number(t.doggo_cash_amount), 0)
  const cashUsado    = txList.filter(t => t.type === 'redeemed' && Number(t.doggo_cash_amount ?? 0) < 0)
                             .reduce((s, t) => s + Math.abs(Number(t.doggo_cash_amount)), 0)
  const totalCanjes  = (redemptions ?? []).length

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-gray-900 text-2xl font-black">Fidelización</h1>
        <Link href="/owner/fidelizacion/nuevo"
          className="bg-doggo-yellow text-doggo-dark font-black px-4 py-2 rounded-full text-sm">
          + Premio
        </Link>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Clientes',         value: totalCustomers,                  sub: 'registrados' },
          { label: 'Estrellas ⭐',     value: totalEstrellas.toLocaleString(), sub: 'ganadas en total' },
          { label: 'Cash emitido',     value: `$${cashEmitido.toFixed(2)}`,    sub: 'Doggo Cash otorgado' },
          { label: 'Cash usado',       value: `$${cashUsado.toFixed(2)}`,      sub: 'canjeado en pedidos' },
          { label: 'Cash activo',      value: `$${cashEnCirculacion.toFixed(2)}`, sub: 'saldo disponible' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-gray-900 text-xl font-black">{s.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

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
              const redeemCount = (redemptions ?? []).filter(rd => rd.reward_id === r.id).length
              return (
                <Link key={r.id} href={`/owner/fidelizacion/${r.id}`}
                  className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-3 hover:bg-gray-100 transition-colors border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-gray-900 font-semibold">{r.name}</p>
                      {isExpired && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Vencido</span>}
                    </div>
                    {r.description && <p className="text-gray-500 text-xs">{r.description}</p>}
                  </div>
                  <div className="text-right ml-4 shrink-0 space-y-0.5">
                    <p className="text-doggo-red font-black text-sm">{r.points_required} ⭐</p>
                    <p className="text-gray-400 text-xs">{redeemCount} canjes</p>
                    <p className={`text-xs font-semibold ${r.active && !isExpired ? 'text-green-700' : 'text-gray-400'}`}>
                      {r.active && !isExpired ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Transacciones ─────────────────────────────────────────── */}
      <section>
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
          Todas las transacciones ({txList.length})
        </p>
        {!txList.length ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">Aún no hay transacciones</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Cliente', 'Descripción', 'Estrellas ⭐', 'Doggo Cash 💵', 'Fecha'].map((h) => (
                      <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txList.map((tx) => {
                    const c = tx.customers
                    const isEarned = tx.type === 'earned'
                    const pts = tx.points ?? 0
                    const cash = Number(tx.doggo_cash_amount ?? 0)
                    return (
                      <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                        <td className="px-5 py-2.5">
                          {c ? (
                            <Link href={`/owner/clientes/${c.id}`}
                              className="text-gray-900 text-sm font-semibold hover:text-doggo-red transition-colors">
                              {c.name}
                            </Link>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[240px] truncate">
                          {tx.description ?? tx.type}
                        </td>
                        <td className="px-4 py-2.5">
                          {pts !== 0 && (
                            <span className={`text-sm font-black ${pts > 0 ? 'text-green-700' : 'text-red-400'}`}>
                              {pts > 0 ? '+' : ''}{pts} ⭐
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {cash !== 0 && (
                            <span className={`text-sm font-black ${cash > 0 ? 'text-green-700' : 'text-red-400'}`}>
                              {cash > 0 ? '+' : ''}${Math.abs(cash).toFixed(2)}
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

      {/* ── Canjes de premios ─────────────────────────────────────── */}
      <section>
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
          Canjes de premios ({totalCanjes})
        </p>
        {!totalCanjes ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">Aún no hay canjes de premios</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
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
                  {(redemptions as Redemption[]).map((rd) => {
                    const c = rd.customers
                    const reward = rd.rewards
                    return (
                      <tr key={rd.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                        <td className="px-5 py-2.5">
                          {c ? (
                            <Link href={`/owner/clientes/${c.id}`}
                              className="text-gray-900 text-sm font-semibold hover:text-doggo-red transition-colors">
                              {c.name}
                            </Link>
                          ) : <span className="text-gray-400 text-sm">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700 text-sm">{reward?.name ?? '—'}</td>
                        <td className="px-4 py-2.5 text-doggo-red font-black text-sm">-{rd.points_used} ⭐</td>
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

    </div>
  )
}
