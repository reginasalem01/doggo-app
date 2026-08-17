export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

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

export default async function OwnerFidelizacionPage() {
  const admin = createAdminClient()

  const [{ data: customers }, { data: transactions }, { data: loyaltyRows }] = await Promise.all([
    admin.from('customers').select('id, name, email, estrellas, doggo_cash, spend_accum').order('estrellas', { ascending: false }),
    admin.from('loyalty_transactions').select('*, customers(id, name)').order('created_at', { ascending: false }).limit(200),
    admin.from('business_settings').select('key, value').in('key', ['loyalty_spend_per_hot_dog', 'loyalty_milestone_count', 'loyalty_milestone_reward']),
  ])

  const ls = Object.fromEntries((loyaltyRows ?? []).map((r) => [r.key, r.value]))
  const spendPerHotDog  = Number(ls['loyalty_spend_per_hot_dog']  ?? 5)
  const milestoneCount  = Number(ls['loyalty_milestone_count']    ?? 5)
  const milestoneReward = Number(ls['loyalty_milestone_reward']   ?? 2.50)

  const txList = (transactions ?? []) as Tx[]

  // ── Métricas
  const totalCustomers   = customers?.length ?? 0
  const totalHotdogs     = customers?.reduce((s, c) => s + (c.estrellas ?? 0), 0) ?? 0
  const totalCycles      = customers?.reduce((s, c) => s + Math.floor((c.estrellas ?? 0) / milestoneCount), 0) ?? 0
  const cashEnCirculacion = customers?.reduce((s, c) => s + Number(c.doggo_cash ?? 0), 0) ?? 0
  const cashEmitido      = txList
    .filter(t => t.type === 'earned' && Number(t.doggo_cash_amount ?? 0) > 0)
    .reduce((s, t) => s + Number(t.doggo_cash_amount), 0)
  const cashUsado        = txList
    .filter(t => t.type === 'redeemed' && Number(t.doggo_cash_amount ?? 0) < 0)
    .reduce((s, t) => s + Math.abs(Number(t.doggo_cash_amount)), 0)

  return (
    <div className="p-6 space-y-8">

      <div>
        <h1 className="text-gray-900 text-2xl font-black">Fidelización</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Reglas actuales: cada ${spendPerHotDog} = 1 🌭 · Junta {milestoneCount} → +${milestoneReward.toFixed(2)} Doggo Cash
        </p>
      </div>

      {/* ── Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Clientes',          value: totalCustomers,                      sub: 'registrados' },
          { label: '🌭 Hot dogs',        value: totalHotdogs.toLocaleString(),       sub: 'acumulados en total' },
          { label: 'Ciclos completados', value: totalCycles.toLocaleString(),        sub: `×$${milestoneReward.toFixed(2)} c/u` },
          { label: 'Cash emitido',       value: `$${cashEmitido.toFixed(2)}`,        sub: 'Doggo Cash otorgado' },
          { label: 'Cash activo',        value: `$${cashEnCirculacion.toFixed(2)}`,  sub: 'saldo disponible' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 font-semibold">{s.label}</p>
            <p className="text-gray-900 text-xl font-black">{s.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Clientes */}
      {customers && customers.length > 0 && (
        <section>
          <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-3">
            Clientes ({customers.length}) — ordenados por hot dogs
          </p>
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Cliente', 'Email', '🌭 Total', 'Ciclo actual', 'Doggo Cash'].map((h) => (
                      <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-5 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const estrellas     = c.estrellas ?? 0
                    const doggoCash     = Number(c.doggo_cash ?? 0)
                    const spendAccum    = Number((c as typeof c & { spend_accum?: number }).spend_accum ?? 0)
                    const cycleProgress = estrellas % milestoneCount
                    const cyclesTotal   = Math.floor(estrellas / milestoneCount)
                    return (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">

                        <td className="px-5 py-2.5">
                          <Link href={`/owner/clientes/${c.id}`}
                            className="text-gray-900 text-sm font-semibold hover:text-doggo-red transition-colors">
                            {c.name}
                          </Link>
                        </td>

                        <td className="px-4 py-2.5 text-gray-500 text-xs">{c.email ?? '—'}</td>

                        <td className="px-4 py-2.5">
                          <p className="text-gray-900 font-black text-sm">{estrellas} 🌭</p>
                          {cyclesTotal > 0 && (
                            <p className="text-gray-400 text-[10px]">{cyclesTotal} {cyclesTotal === 1 ? 'ciclo' : 'ciclos'}</p>
                          )}
                        </td>

                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-0.5 mb-0.5">
                            {Array.from({ length: milestoneCount }).map((_, i) => {
                              const isFull  = i < cycleProgress
                              const isNext  = i === cycleProgress
                              const partial = isNext ? spendAccum / spendPerHotDog : 0
                              return (
                                <div
                                  key={i}
                                  className="relative w-5 h-5 rounded flex items-center justify-center text-xs overflow-hidden"
                                  style={{ background: isFull ? 'rgba(220,38,38,0.1)' : 'rgba(0,0,0,0.04)' }}
                                >
                                  {isNext && partial > 0 && (
                                    <div className="absolute left-0 top-0 bottom-0 rounded"
                                      style={{ width: `${partial * 100}%`, background: 'rgba(220,38,38,0.18)' }} />
                                  )}
                                  <span className="relative" style={{ opacity: isFull ? 1 : isNext && partial > 0 ? 0.55 : 0.18 }}>🌭</span>
                                </div>
                              )
                            })}
                            <span className="text-gray-400 text-xs ml-1">{cycleProgress}/{milestoneCount}</span>
                          </div>
                          {spendAccum > 0 && (
                            <p className="text-amber-600 text-[10px]">Lleva ${spendAccum.toFixed(2)} de ${spendPerHotDog}</p>
                          )}
                        </td>

                        <td className="px-4 py-2.5">
                          <span className={`font-black text-sm ${doggoCash > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            ${doggoCash.toFixed(2)}
                          </span>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Transacciones */}
      <section>
        <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-1">
          Historial de transacciones ({txList.length})
        </p>
        <p className="text-gray-400 text-xs mb-3">
          Cada vez que alguien gana 🌭, completa un ciclo y recibe cash, o usa su Doggo Cash en un pedido.
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
                    {['Cliente', 'Tipo', 'Detalle', '🌭', 'Doggo Cash', 'Fecha'].map((h) => (
                      <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-5 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txList.map((tx) => {
                    const c        = tx.customers
                    const pts      = tx.points ?? 0
                    const cash     = Number(tx.doggo_cash_amount ?? 0)
                    const isEarned = tx.type === 'earned'
                    const gotCash  = isEarned && cash > 0
                    return (
                      <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">

                        <td className="px-5 py-2.5">
                          {c ? (
                            <Link href={`/owner/clientes/${c.id}`}
                              className="text-gray-900 text-sm font-semibold hover:text-doggo-red transition-colors">
                              {c.name}
                            </Link>
                          ) : <span className="text-gray-400 text-sm">—</span>}
                        </td>

                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isEarned
                              ? gotCash
                                ? 'bg-doggo-yellow/20 text-yellow-800'
                                : 'bg-green-50 text-green-700'
                              : 'bg-doggo-red/10 text-doggo-red'
                          }`}>
                            {isEarned ? (gotCash ? '🎯 Ciclo completo' : '🌭 Acumuló') : '💸 Usó cash'}
                          </span>
                        </td>

                        <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[240px] truncate">
                          {tx.description ?? tx.type}
                        </td>

                        <td className="px-4 py-2.5">
                          {pts !== 0 && (
                            <span className={`text-sm font-black ${pts > 0 ? 'text-green-700' : 'text-red-400'}`}>
                              {pts > 0 ? '+' : ''}{pts} 🌭
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-2.5">
                          {cash !== 0 && (
                            <span className={`text-sm font-black ${cash > 0 ? 'text-green-700' : 'text-doggo-red'}`}>
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

      {/* ── Info de uso del Cash */}
      {cashUsado > 0 && (
        <div className="bg-doggo-yellow/10 border border-doggo-yellow/30 rounded-2xl px-5 py-4 text-sm text-gray-700">
          <p className="font-bold mb-1">💡 Resumen de uso</p>
          <p>Se ha emitido <span className="font-black">${cashEmitido.toFixed(2)}</span> de Doggo Cash en total.</p>
          <p>Los clientes han usado <span className="font-black text-doggo-red">${cashUsado.toFixed(2)}</span> en pedidos.</p>
          <p>Quedan <span className="font-black text-green-600">${cashEnCirculacion.toFixed(2)}</span> en saldo disponible.</p>
        </div>
      )}

    </div>
  )
}
