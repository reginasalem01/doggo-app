export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const STATUS_LABEL: Record<string, string> = {
  new: 'Nuevo', accepted: 'Aceptado', preparing: 'Preparando',
  ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado',
}

export default async function OwnerClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: customer }, { data: transactions }, { data: loyaltyRows }] = await Promise.all([
    admin.from('customers').select('*').eq('id', id).single(),
    admin.from('loyalty_transactions').select('*').eq('customer_id', id)
      .order('created_at', { ascending: false }).limit(50),
    admin.from('business_settings').select('key, value')
      .in('key', ['loyalty_spend_per_hot_dog', 'loyalty_milestone_count', 'loyalty_milestone_reward']),
  ])

  const ls = Object.fromEntries((loyaltyRows ?? []).map((r) => [r.key, r.value]))
  const spendPerHotDog  = Number(ls['loyalty_spend_per_hot_dog']  ?? 5)
  const milestoneCount  = Number(ls['loyalty_milestone_count']    ?? 5)
  const milestoneReward = Number(ls['loyalty_milestone_reward']   ?? 2.50)

  if (!customer) notFound()

  // Fetch orders via linked_customer_id (POS/walk-in) AND customer_email (online orders)
  // then merge + deduplicate so both walk-in and app orders appear
  const [{ data: ordersByIdData }, { data: ordersByEmailData }] = await Promise.all([
    admin.from('orders')
      .select('id, created_at, total, status')
      .eq('linked_customer_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    customer.email
      ? admin.from('orders')
          .select('id, created_at, total, status')
          .eq('customer_email', customer.email)
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] as { id: string; created_at: string; total: number; status: string }[], error: null }),
  ])

  const seenIds = new Set<string>()
  const customerOrders = [...(ordersByIdData ?? []), ...(ordersByEmailData ?? [])]
    .filter((o) => { if (seenIds.has(o.id)) return false; seenIds.add(o.id); return true })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)

  const initials      = customer.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const estrellas     = customer.estrellas ?? 0
  const spendAccum    = Number(customer.spend_accum ?? 0)
  const cycleProgress = estrellas % milestoneCount
  const cyclesTotal   = Math.floor(estrellas / milestoneCount)
  const totalSpent    = customerOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + Number(o.total), 0)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/clientes" className="text-gray-500 hover:text-gray-900 text-sm">← Clientes</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-gray-900 text-xl font-black">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-doggo-red/10 flex items-center justify-center shrink-0">
                <span className="text-doggo-red font-black text-xl">{initials}</span>
              </div>
              <div>
                <p className="text-gray-900 text-lg font-black">{customer.name}</p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  {Array.from({ length: milestoneCount }).map((_, i) => {
                    const isFull  = i < cycleProgress
                    const isNext  = i === cycleProgress
                    const partial = isNext ? spendAccum / spendPerHotDog : 0
                    return (
                      <div
                        key={i}
                        className="relative w-5 h-5 rounded flex items-center justify-center text-xs overflow-hidden"
                        style={{ background: isFull ? 'rgba(220,38,38,0.12)' : 'rgba(0,0,0,0.04)' }}
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
                  <p className="text-amber-600 text-[10px] mt-0.5">Lleva ${spendAccum.toFixed(2)} de ${spendPerHotDog} para el próximo 🌭</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              {customer.email && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Email</span>
                  <span className="text-gray-900 text-sm">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Teléfono</span>
                  <span className="text-gray-900 text-sm">{customer.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Cliente desde</span>
                <span className="text-gray-900 text-sm">
                  {new Date(customer.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-doggo-red text-2xl font-black">{estrellas}</p>
              <p className="text-gray-500 text-xs mt-0.5">🌭 total</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-doggo-yellow text-2xl font-black">{cyclesTotal}</p>
              <p className="text-gray-500 text-xs mt-0.5">ciclos (+${(cyclesTotal * milestoneReward).toFixed(2)})</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-green-600 text-2xl font-black">${Number(customer.doggo_cash ?? 0).toFixed(2)}</p>
              <p className="text-gray-500 text-xs mt-0.5">Doggo Cash</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-gray-900 text-2xl font-black">${totalSpent.toFixed(0)}</p>
              <p className="text-gray-500 text-xs mt-0.5">{customerOrders.length} pedidos</p>
            </div>
          </div>

          {/* Orders */}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Pedidos ({customerOrders.length})</p>
            {!customerOrders.length ? (
              <p className="text-gray-500 text-sm">Sin pedidos registrados</p>
            ) : (
              <div className="space-y-2">
                {customerOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/owner/pedidos/${o.id}`}
                    className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="text-doggo-red font-mono text-xs font-bold">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(o.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{STATUS_LABEL[o.status] ?? o.status}
                      </p>
                    </div>
                    <p className="text-gray-900 font-bold">${Number(o.total).toFixed(2)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: loyalty transactions */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
            Transacciones de fidelización ({transactions?.length ?? 0})
          </p>
          {!transactions?.length ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-sm">Sin movimientos aún</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              {transactions.map((t, i) => {
                const pts  = t.points ?? 0
                const cash = Number((t as { doggo_cash_amount?: number | null }).doggo_cash_amount ?? 0)
                const isEarned = t.type === 'earned'
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 px-5 py-3 ${i < transactions.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${isEarned ? 'bg-green-50' : 'bg-red-50'}`}>
                      {isEarned ? '🌭' : '💰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm truncate">{t.description ?? t.type}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(t.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {new Date(t.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      {pts !== 0 && (
                        <p className={`font-black text-sm ${pts > 0 ? 'text-green-700' : 'text-red-400'}`}>
                          {pts > 0 ? '+' : ''}{pts} 🌭
                        </p>
                      )}
                      {cash !== 0 && (
                        <p className={`font-black text-sm ${cash > 0 ? 'text-green-700' : 'text-red-400'}`}>
                          {cash > 0 ? '+' : ''}${Math.abs(cash).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
