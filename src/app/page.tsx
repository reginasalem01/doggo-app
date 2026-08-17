export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Doggo · Hotdog sin dramas',
  description: 'Pide en línea, gana puntos y reserva tu mesa. Los mejores hot dogs de Guayaquil en Plaza Guayarte.',
}
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

  // Ecuador is UTC-5 — use correct local date for promos filter
  const today = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [{ data: featured }, { data: promos }, { data: customer }, { data: settingsRows }] = await Promise.all([
    admin.from('products').select('*').eq('available', true).order('sort_order').limit(6),
    admin.from('promotions').select('*').eq('active', true).or(`ends_at.is.null,ends_at.gte.${today}`).order('created_at', { ascending: false }).limit(3),
    user
      ? admin.from('customers').select('id, name, estrellas, doggo_cash, spend_accum').eq('auth_user_id', user.id).single()
      : Promise.resolve({ data: null }),
    admin.from('business_settings').select('key, value').in('key', ['whatsapp_number', 'loyalty_spend_per_hot_dog', 'loyalty_milestone_count', 'loyalty_milestone_reward']),
  ])

  const rows = (settingsRows as { key: string; value: string }[] | null) ?? []
  const whatsappNumber   = rows.find((r) => r.key === 'whatsapp_number')?.value ?? ''
  const spendPerHotDog   = Number(rows.find((r) => r.key === 'loyalty_spend_per_hot_dog')?.value  ?? 5)
  const milestoneCount   = Number(rows.find((r) => r.key === 'loyalty_milestone_count')?.value    ?? 5)
  const milestoneReward  = Number(rows.find((r) => r.key === 'loyalty_milestone_reward')?.value   ?? 2.50)

  return (
    <div className="min-h-screen bg-white pb-24">
      <SplashScreen />

      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="sticky top-safe z-30 bg-white px-4 py-3 flex items-center justify-between">
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

      {/* ── LOYALTY CARD (if logged in) ───────────────────── */}
      {customer && (() => {
        const estrellas    = customer.estrellas ?? 0
        const doggoCash    = Number(customer.doggo_cash ?? 0)
        const spendAccum   = Number((customer as typeof customer & { spend_accum?: number }).spend_accum ?? 0)
        const cycleProgress = estrellas % milestoneCount
        return (
          <div className="px-4 mb-6">
            <Link href="/perfil" className="block relative rounded-3xl overflow-hidden select-none"
              style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1800 55%, #0f0800 100%)' }}>

              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(115deg, transparent 0%, rgba(253,196,35,0.07) 45%, transparent 80%)' }} />
              <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #FDC423 0%, transparent 70%)' }} />

              <div className="relative p-5">
                {/* Row 1: Chip + logo */}
                <div className="flex items-center justify-between mb-4">
                  <svg width="34" height="26" viewBox="0 0 34 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="34" height="26" rx="4" fill="url(#hcg)"/>
                    <rect x="13" y="0"  width="8" height="26" fill="rgba(0,0,0,0.18)"/>
                    <rect x="0"  y="9"  width="34" height="8"  fill="rgba(0,0,0,0.18)"/>
                    <rect x="13" y="9"  width="8"  height="8"  rx="1" fill="rgba(0,0,0,0.28)"/>
                    <defs>
                      <linearGradient id="hcg" x1="0" y1="0" x2="34" y2="26" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#C8960C"/>
                        <stop offset="0.5" stopColor="#F5CB35"/>
                        <stop offset="1" stopColor="#C8960C"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-white font-black text-xs tracking-widest opacity-80">🌭 DOGGO</span>
                </div>

                {/* Row 2: Cash balance */}
                <div className="mb-4">
                  <p className="text-white/40 text-[9px] font-bold tracking-widest uppercase mb-0.5">Doggo Cash</p>
                  <p className="text-doggo-yellow font-black leading-none" style={{ fontSize: '2.6rem', letterSpacing: '-1px' }}>
                    ${doggoCash.toFixed(2)}
                  </p>
                </div>

                {/* Row 3: Hot dog jar */}
                <div className="mb-4">
                  <div className="flex gap-1.5 mb-1.5">
                    {Array.from({ length: milestoneCount }).map((_, i) => {
                      const isFull  = i < cycleProgress
                      const isNext  = i === cycleProgress
                      const partial = isNext ? spendAccum / spendPerHotDog : 0
                      return (
                        <div
                          key={i}
                          className="flex-1 h-6 rounded-md flex items-center justify-center text-sm relative overflow-hidden"
                          style={{ background: isFull ? 'rgba(253,196,35,0.25)' : 'rgba(255,255,255,0.07)' }}
                        >
                          {isNext && partial > 0 && (
                            <div className="absolute left-0 top-0 bottom-0 rounded-md"
                              style={{ width: `${partial * 100}%`, background: 'rgba(253,196,35,0.18)' }} />
                          )}
                          <span className="relative" style={{ opacity: isFull ? 1 : isNext && partial > 0 ? 0.5 : 0.2 }}>🌭</span>
                        </div>
                      )
                    })}
                  </div>
                  {spendAccum > 0 && (
                    <p className="text-doggo-yellow/60 text-[9px] mb-0.5">
                      Llevas ${spendAccum.toFixed(2)} de ${spendPerHotDog} para el próximo 🌭
                    </p>
                  )}
                  <p className="text-white/30 text-[9px]">
                    {cycleProgress === 0
                      ? `Cada $${spendPerHotDog} = 1 🌭 · Junta ${milestoneCount} → +$${milestoneReward.toFixed(2)}`
                      : `${milestoneCount - cycleProgress} 🌭 más para +$${milestoneReward.toFixed(2)} Doggo Cash`
                    }
                  </p>
                </div>

                {/* Row 4: Name */}
                <p className="text-white/40 text-[10px] font-semibold tracking-widest uppercase">
                  {customer.name.split(' ')[0].toUpperCase()}
                </p>
              </div>
            </Link>
          </div>
        )
      })()}

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
          <div className="rounded-3xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2d1a00 100%)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #FDC423 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="p-5 relative">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Club Doggo</p>
              <p className="text-white font-black text-xl leading-tight mb-1">Gana 🌭 con<br />cada pedido</p>
              <p className="text-white/50 text-xs mb-4">Cada ${spendPerHotDog} = 1 🌭 · Junta {milestoneCount} → ganás ${milestoneReward.toFixed(2)}</p>
              <Link href="/login" className="inline-block bg-doggo-yellow text-doggo-dark font-black text-sm px-5 py-2.5 rounded-2xl">
                Unirme gratis →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTÁCTANOS ──────────────────────────────────── */}
      <div className="px-4 mb-6">
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-gray-900 font-black text-sm mb-3">¿Necesitas ayuda?</p>
          <div className="space-y-2">
            <a
              href={whatsappNumber ? `https://wa.me/${whatsappNumber}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 active:bg-green-100 transition-colors"
            >
              <span className="text-xl">💬</span>
              <div>
                <p className="text-gray-900 font-bold text-sm">WhatsApp</p>
                <p className="text-gray-500 text-xs">Escríbenos al +593 XX XXX XXXX</p>
              </div>
              <span className="ml-auto text-gray-400 text-lg">›</span>
            </a>
            <a
              href={whatsappNumber ? `tel:+${whatsappNumber}` : '#'}
              className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3 active:bg-gray-200 transition-colors"
            >
              <span className="text-xl">📞</span>
              <div>
                <p className="text-gray-900 font-bold text-sm">Llamar</p>
                <p className="text-gray-500 text-xs">+593 XX XXX XXXX</p>
              </div>
              <span className="ml-auto text-gray-400 text-lg">›</span>
            </a>
          </div>
          <p className="text-gray-400 text-xs mt-3 text-center">📍 Plaza Guayarte · Guayaquil</p>
        </div>
      </div>

    </div>
  )
}
