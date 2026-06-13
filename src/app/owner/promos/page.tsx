import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function OwnerPromosPage() {
  const admin = createAdminClient()
  const { data: promos } = await admin
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-black">Promos</h1>
        </div>
        <Link
          href="/owner/promos/nuevo"
          className="bg-doggo-yellow text-doggo-dark font-black px-4 py-2 rounded-full text-sm"
        >
          + Nueva
        </Link>
      </div>

      {!promos?.length ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-gray-400 mb-4">No hay promos aún</p>
          <Link href="/owner/promos/nuevo" className="bg-doggo-yellow text-doggo-dark font-black px-6 py-2 rounded-full text-sm">
            Crear primera promo
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map((promo) => {
            const hasImage = !!promo.image_url
            const dateRange = promo.starts_at || promo.ends_at
              ? `${promo.starts_at ?? '?'} → ${promo.ends_at ?? '?'}`
              : null

            return (
              <Link
                key={promo.id}
                href={`/owner/promos/${promo.id}`}
                className="block bg-doggo-dark2 rounded-2xl overflow-hidden hover:bg-doggo-dark3 transition-colors"
              >
                {hasImage && (
                  <img src={promo.image_url} alt={promo.title} className="w-full h-28 object-cover" />
                )}
                <div className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">{promo.title}</p>
                    {promo.description && (
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{promo.description}</p>
                    )}
                    {dateRange && (
                      <p className="text-gray-500 text-xs mt-1">📅 {dateRange}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${promo.active ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      {promo.active ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className="text-gray-500 text-xs">›</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
