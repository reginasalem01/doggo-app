import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const LEVEL = (pts: number) =>
  pts >= 500 ? { label: 'Oro', color: 'text-yellow-400' }
  : pts >= 200 ? { label: 'Plata', color: 'text-gray-300' }
  : { label: 'Bronce', color: 'text-orange-400' }

export default async function OwnerClientesPage() {
  const admin = createAdminClient()
  const { data: customers } = await admin
    .from('customers')
    .select('*')
    .order('points', { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-black">Clientes</h1>
        <p className="text-gray-400 text-sm mt-0.5">{customers?.length ?? 0} registrados</p>
      </div>

      {!customers?.length ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">👤</p>
          <p className="text-gray-400">No hay clientes registrados aún</p>
        </div>
      ) : (
        <div className="bg-doggo-dark2 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-doggo-dark3">
                {['Cliente', 'Email', 'Teléfono', 'Nivel', 'Puntos', 'Desde'].map((h) => (
                  <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-6 last:pr-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const initials = c.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                const lvl = LEVEL(c.points)
                return (
                  <tr key={c.id} className="border-b border-doggo-dark3/40 hover:bg-doggo-dark3/30 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/owner/clientes/${c.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-doggo-yellow/20 flex items-center justify-center shrink-0">
                          <span className="text-doggo-yellow font-black text-xs">{initials}</span>
                        </div>
                        <span className="text-white font-semibold text-sm group-hover:text-doggo-yellow transition-colors">{c.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${lvl.color}`}>{lvl.label}</span>
                    </td>
                    <td className="px-4 py-3 text-doggo-yellow font-black text-sm">{c.points}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
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
