import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function OwnerFidelizacionPage() {
  const admin = createAdminClient()

  const [{ data: rewards }, { data: redemptions }] = await Promise.all([
    admin.from('rewards').select('*').order('points_required', { ascending: true }),
    admin
      .from('reward_redemptions')
      .select('*, customers(name, email)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-black">Fidelización</h1>
        </div>
        <Link
          href="/owner/fidelizacion/nuevo"
          className="bg-doggo-yellow text-doggo-dark font-black px-4 py-2 rounded-full text-sm"
        >
          + Premio
        </Link>
      </div>

      {/* Rewards list */}
      <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Premios ({rewards?.length ?? 0})</p>
      {!rewards?.length ? (
        <div className="bg-doggo-dark2 rounded-2xl p-6 text-center mb-6">
          <p className="text-gray-500 text-sm">No hay premios creados</p>
        </div>
      ) : (
        <div className="space-y-2 mb-8">
          {rewards.map((r) => {
            const expires = r.expires_at
              ? new Date(r.expires_at + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
              : null
            const isExpired = r.expires_at && new Date(r.expires_at) < new Date()

            return (
              <Link
                key={r.id}
                href={`/owner/fidelizacion/${r.id}`}
                className="flex items-center justify-between bg-doggo-dark2 rounded-2xl px-4 py-3 hover:bg-doggo-dark3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-semibold truncate">{r.name}</p>
                    {isExpired && (
                      <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full shrink-0">Vencido</span>
                    )}
                  </div>
                  {r.description && <p className="text-gray-400 text-xs truncate">{r.description}</p>}
                  {expires && <p className="text-gray-500 text-xs mt-0.5">Vence: {expires}</p>}
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-doggo-yellow font-black text-sm">{r.points_required} pts</p>
                  <span className={`text-xs ${r.active && !isExpired ? 'text-green-400' : 'text-gray-500'}`}>
                    {r.active && !isExpired ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Redemptions history */}
      <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Canjes recientes ({redemptions?.length ?? 0})</p>
      {!redemptions?.length ? (
        <div className="bg-doggo-dark2 rounded-2xl p-6 text-center">
          <p className="text-gray-500 text-sm">Aún no hay canjes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {redemptions.map((rd) => {
            const date = new Date(rd.created_at).toLocaleDateString('es-EC', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            const customer = rd.customers as { name: string; email: string } | null
            return (
              <div key={rd.id} className="flex justify-between items-center bg-doggo-dark2 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-semibold">{customer?.name ?? 'Cliente'}</p>
                  <p className="text-gray-400 text-xs">{date}</p>
                </div>
                <p className="text-red-400 font-black text-sm">-{rd.points_used} pts</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
