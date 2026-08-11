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

export default async function OwnerFidelizacionPage() {
  const admin = createAdminClient()

  const [{ data: customers }, { data: transactions }] = await Promise.all([
    admin.from('customers').select('id, name, email, estrellas, doggo_cash').order('estrellas', { ascending: false }),
    admin
      .from('loyalty_transactions')
      .select('*, customers(id, name)')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const txList = (transactions ?? []) as Tx[]

  // ── Métricas
  const totalCustomers     = customers?.length ?? 0
  const totalHotdogs       = customers?.reduce((s, c) => s + (c.estrellas ?? 0), 0) ?? 0
  const cashEnCirculacion  = customers?.reduce((s, c) => s + Number(c.doggo_cash ?? 0), 0) ?? 0
  const cashEmitido        = txList
    .filter(t => t.type === 'earned' && Number(t.doggo_cash_amount ?? 0) > 0)
    .reduce((s, t) => s + Number(t.doggo_cash_amount), 0)
  const cashUsado          = txList
    .filter(t => t.type === 'redeemed' && Number(t.doggo_cash_amount ?? 0) < 0)
    .reduce((s, t) => s + Math.abs(Number(t.doggo_cash_amount)), 0)

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <h1 className="text-gray-900 text-2xl font-black">Fidelización</h1>

      {/* ── Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Clientes',        value: totalCustomers,                     sub: 'registrados' },
          { label: 'Hot Dogs 🌭',     value: totalHotdogs.toLocaleString(),      sub: 'acumulados en total' },
          { label: 'Cash emitido',    value: `$${cashEmitido.toFixed(2)}`,       sub: 'Doggo Cash otorgado' },
          { label: 'Cash usado',      value: `$${cashUsado.toFixed(2)}`,         sub: 'usado en pedidos' },
          { label: 'Cash activo',     value: `$${cashEnCirculacion.toFixed(2)}`, sub: 'saldo disponible' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-gray-900 text-xl font-black">{s.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Clientes top */}
      {customers && customers.length > 0 && (
        <section>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
            Clientes ({customers.length})
          </p>
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Cliente', 'Email', 'Nivel', '🌭', 'Doggo Cash'].map((h) => (
                      <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const tier = tierLabel(c.estrellas ?? 0)
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
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tier.color}`}>
                            {tier.emoji} {tier.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-900 font-black text-sm">
                          {c.estrellas ?? 0} 🌭
                        </td>
                        <td className="px-4 py-2.5 text-doggo-red font-black text-sm">
                          ${Number(c.doggo_cash ?? 0).toFixed(2)}
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
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
          Todas las transacciones ({txList.length})
        </p>
        <p className="text-gray-400 text-xs mb-3">
          Aquí ves cuando un cliente gana 🌭 o usa Doggo Cash (por eso el pedido cuesta menos).
        </p>
        {!txList.length ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">Aún no hay transacciones</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Cliente', 'Tipo', 'Descripción', '🌭', 'Doggo Cash', 'Fecha'].map((h) => (
                      <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txList.map((tx) => {
                    const c = tx.customers
                    const pts = tx.points ?? 0
                    const cash = Number(tx.doggo_cash_amount ?? 0)
                    const isEarned = tx.type === 'earned'
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
                              ? 'bg-green-50 text-green-700'
                              : 'bg-doggo-red/10 text-doggo-red'
                          }`}>
                            {isEarned ? '🌭 Ganó' : '💸 Usó cash'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[220px] truncate">
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

    </div>
  )
}
