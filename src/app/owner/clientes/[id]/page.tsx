import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const LEVEL = (pts: number) =>
  pts >= 500 ? { label: 'Oro 🥇', color: 'text-yellow-600' }
  : pts >= 200 ? { label: 'Plata 🥈', color: 'text-gray-500' }
  : { label: 'Bronce 🥉', color: 'text-orange-700' }

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

  const [{ data: customer }, { data: transactions }] = await Promise.all([
    admin.from('customers').select('*').eq('id', id).single(),
    admin.from('loyalty_transactions').select('*').eq('customer_id', id)
      .order('created_at', { ascending: false }).limit(50),
  ])

  if (!customer) notFound()

  const { data: customerOrders } = customer.email
    ? await admin.from('orders')
        .select('id, created_at, total, status')
        .eq('customer_email', customer.email)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] }

  const initials = customer.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const lvl = LEVEL(customer.points)
  const totalSpent = customerOrders?.filter((o) => o.status === 'delivered').reduce((s, o) => s + Number(o.total), 0) ?? 0

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
                <p className={`text-sm font-bold ${lvl.color}`}>{lvl.label}</p>
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
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-doggo-red text-2xl font-black">{customer.points}</p>
              <p className="text-gray-500 text-xs mt-0.5">puntos</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-gray-900 text-2xl font-black">{customerOrders?.length ?? 0}</p>
              <p className="text-gray-500 text-xs mt-0.5">pedidos</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-gray-900 text-2xl font-black">${totalSpent.toFixed(0)}</p>
              <p className="text-gray-500 text-xs mt-0.5">gastado</p>
            </div>
          </div>

          {/* Orders */}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Pedidos ({customerOrders?.length ?? 0})</p>
            {!customerOrders?.length ? (
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
            Movimientos de puntos ({transactions?.length ?? 0})
          </p>
          {!transactions?.length ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-sm">Sin movimientos aún</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl overflow-hidden">
              {transactions.map((t, i) => {
                const isPositive = t.points > 0
                return (
                  <div
                    key={t.id}
                    className={`flex justify-between items-center px-5 py-3 ${i < transactions.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div>
                      <p className="text-gray-900 text-sm">{t.description ?? t.type}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(t.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <p className={`font-black text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{t.points} pts
                    </p>
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
