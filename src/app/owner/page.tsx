import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function OwnerPage() {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: pedidosHoy },
    { count: reservasPendientes },
    { count: totalClientes },
    { count: productosActivos },
    { data: ventasHoy },
    { data: pedidosRecientes },
  ] = await Promise.all([
    admin.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
    admin.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('customers').select('*', { count: 'exact', head: true }),
    admin.from('products').select('*', { count: 'exact', head: true }).eq('available', true),
    admin.from('orders').select('total').gte('created_at', `${today}T00:00:00`).eq('payment_status', 'paid'),
    admin.from('orders').select('id, customer_name, total, status, created_at').order('created_at', { ascending: false }).limit(8),
  ])

  const totalVentas = ventasHoy?.reduce((s, o) => s + Number(o.total), 0) ?? 0

  const STATUS_COLOR: Record<string, string> = {
    new:       'bg-yellow-100 text-yellow-700 border border-yellow-200',
    accepted:  'bg-blue-100 text-blue-700 border border-blue-200',
    preparing: 'bg-orange-100 text-orange-700 border border-orange-200',
    ready:     'bg-green-100 text-green-700 border border-green-200',
    delivered: 'bg-gray-100 text-gray-600 border border-gray-200',
    cancelled: 'bg-red-100 text-red-600 border border-red-200',
  }
  const STATUS_LABEL: Record<string, string> = {
    new: 'Nuevo', accepted: 'Aceptado', preparing: 'Preparando',
    ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado',
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-900 text-2xl font-black">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats — 2x2 grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Ventas hoy (pagadas)</p>
          <p className="text-doggo-red text-3xl font-black">${totalVentas.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Pedidos hoy</p>
          <p className="text-gray-900 text-3xl font-black">{pedidosHoy ?? 0}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Reservas pendientes</p>
          <p className={`text-3xl font-black ${(reservasPendientes ?? 0) > 0 ? 'text-doggo-red' : 'text-gray-900'}`}>
            {reservasPendientes ?? 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Clientes registrados</p>
          <p className="text-gray-900 text-3xl font-black">{totalClientes ?? 0}</p>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-gray-50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <p className="text-gray-900 font-black">Pedidos recientes</p>
          <Link href="/owner/pedidos" className="text-doggo-red text-xs font-bold hover:underline">Ver todos →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-gray-500 text-xs uppercase tracking-wide pl-5 pr-3 py-3">ID</th>
                <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-3 py-3">Cliente</th>
                <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-3 py-3">Hora</th>
                <th className="text-left text-gray-500 text-xs uppercase tracking-wide px-3 py-3">Estado</th>
                <th className="text-right text-gray-500 text-xs uppercase tracking-wide px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {pedidosRecientes?.map((o) => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                  <td className="pl-5 pr-3 py-3 text-doggo-red font-mono text-xs font-bold">{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-3 py-3 text-gray-900 text-sm">{o.customer_name}</td>
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(o.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[o.status] ?? ''}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-900 font-bold">${Number(o.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!pedidosRecientes?.length && (
          <p className="text-gray-500 text-center py-8 text-sm">No hay pedidos hoy</p>
        )}
      </div>
    </div>
  )
}
