import Link from 'next/link'
import CartIcon from '@/components/ui/CartIcon'
import FeaturedProducts from '@/components/ui/FeaturedProducts'
import ActiveOrderBanner from '@/components/ui/ActiveOrderBanner'
import SplashScreen from '@/components/ui/SplashScreen'
import DoggoLogo from '@/components/ui/DoggoLogo'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const admin = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]

  const [{ data: featured }, { data: promos }, { data: customer }] = await Promise.all([
    admin.from('products').select('*').eq('available', true).order('sort_order').limit(6),
    admin.from('promotions').select('*').eq('active', true).or(`ends_at.is.null,ends_at.gte.${today}`).order('created_at', { ascending: false }).limit(3),
    user
      ? admin.from('customers').select('id, name, points').eq('auth_user_id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  function getLevel(pts: number) {
    if (pts >= 500) return { label: 'Oro', emoji: '🥇' }
    if (pts >= 200) return { label: 'Plata', emoji: '🥈' }
    return { label: 'Bronce', emoji: '🥉' }
  }

  const level = customer ? getLevel(customer.points) : null

  return (
    <div className="min-h-screen bg-white pb-24">
      <SplashScreen />

      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white px-4 pb-4 pt-safe flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DoggoLogo size={48} />
          <div>
            <p className="text-gray-900 font-bold text-base leading-tight">
              {customer ? `Hola, ${customer.name.split(' ')[0]} 👋` : 'Hola 👋'}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">📍 Plaza Guayarte · Guayaquil</p>
          </div>
        </div>
        <CartIcon />
      </div>

      {/* ── ACTIVE ORDER BANNER ───────────────────────────── */}
      <ActiveOrderBanner />

      {/* ── LOYALTY STRIP (if logged in) ──────────────────── */}
      {customer && level && (
        <div className="px-4 mb-5">
          <Link href="/perfil">
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 border border-doggo-yellow/20">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{level.emoji}</span>
                <div>
                  <p className="text-gray-900 font-black text-sm leading-none">{customer.name.split(' ')[0]}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Nivel {level.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-doggo-red font-black text-lg leading-none">{customer.points}</p>
                  <p className="text-gray-500 text-[10px]">puntos</p>
                </div>
                <span className="text-gray-500 text-sm">›</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── PROMOS (if any) ───────────────────────────────── */}
      {promos && promos.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {promos.map((promo) => (
              <div
                key={promo.id}
                className="shrink-0 rounded-2xl overflow-hidden flex items-stretch"
                style={{ width: promos.length === 1 ? '100%' : '80vw', maxWidth: '340px', background: 'linear-gradient(135deg, #8B1A1A, #5a0f0f)' }}
              >
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <span className="inline-block bg-doggo-yellow text-doggo-dark text-[10px] font-black px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                      {promo.ends_at ? `Hasta ${new Date(promo.ends_at + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}` : 'Promo'}
                    </span>
                    <p className="text-white font-black text-lg leading-tight">{promo.title}</p>
                    {promo.description && <p className="text-red-200 text-xs mt-1 line-clamp-2">{promo.description}</p>}
                  </div>
                  <Link href="/menu" className="mt-3 self-start bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    Ordenar →
                  </Link>
                </div>
                {promo.image_url && (
                  <img src={promo.image_url} alt={promo.title} className="w-28 object-cover shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LO MÁS PEDIDO ────────────────────────────────── */}
      {featured && featured.length > 0 && (
        <div className="mb-6">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-gray-900 font-black text-base">Lo más pedido</h2>
            <Link href="/menu" className="text-doggo-red text-xs font-bold">Ver todo →</Link>
          </div>

          <FeaturedProducts products={featured} />
        </div>
      )}

      {/* ── RESERVE CTA ──────────────────────────────────── */}
      <div className="px-4 mb-6">
        <Link href="/reservas">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-doggo-yellow/10 rounded-xl flex items-center justify-center">
                <span className="text-xl">📅</span>
              </div>
              <div>
                <p className="text-gray-900 font-black text-sm">Reserva tu mesa</p>
                <p className="text-gray-500 text-xs">Elige fecha, hora y personas</p>
              </div>
            </div>
            <span className="text-doggo-red font-black text-lg">›</span>
          </div>
        </Link>
      </div>

      {/* ── LOYALTY TEASER (if not logged in) ────────────── */}
      {!customer && (
        <div className="px-4 mb-6">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-200">
            <div className="w-12 h-12 bg-doggo-yellow/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-black text-sm">Gana puntos con cada pedido</p>
              <p className="text-gray-500 text-xs mt-0.5">$1 = 1 punto. Canjea premios exclusivos.</p>
            </div>
            <Link href="/login" className="bg-doggo-yellow text-doggo-dark font-black text-xs px-3 py-2 rounded-xl shrink-0">
              Entrar
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
