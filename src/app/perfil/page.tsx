export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Mi perfil · Doggo',
  description: 'Tu saldo Doggo Cash, estrellas, historial de pedidos y recompensas.',
}
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Customer, LoyaltyTransaction } from '@/types'
import LogoutButton from './LogoutButton'
import Link from 'next/link'

// Bronce 0-10 🌭 · Plata 11-25 🌭 · Oro 26+ 🌭
const LEVELS = [
  { label: 'Bronce', emoji: '🥉', min: 0,  color: '#CD7F32', rate: 0.50 },
  { label: 'Plata',  emoji: '🥈', min: 11, color: '#A8A9AD', rate: 0.75 },
  { label: 'Oro',    emoji: '🥇', min: 26, color: '#F5C400', rate: 1.00 },
]

function getLevel(estrellas: number) {
  return LEVELS.findLast((l) => estrellas >= l.min) ?? LEVELS[0]
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  let { data: customer } = await admin.from('customers').select('*').eq('auth_user_id', user.id).single()

  if (!customer) {
    const { data: byEmail } = await admin.from('customers').select('*').eq('email', user.email!).single()
    if (byEmail) {
      await admin.from('customers').update({ auth_user_id: user.id }).eq('id', byEmail.id)
      customer = { ...byEmail, auth_user_id: user.id }
    } else {
      const name = (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'Cliente'
      const { data: newCustomer } = await admin
        .from('customers').insert({ auth_user_id: user.id, name, email: user.email, points: 0, estrellas: 0, doggo_cash: 0 }).select().single()
      customer = newCustomer
    }
  }

  if (!customer) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-900">No se pudo cargar el perfil</p>
    </div>
  )

  const c = customer as Customer

  const estrellas = c.estrellas ?? 0
  const doggo_cash = Number(c.doggo_cash ?? 0)

  const { data: transactions } = await admin
    .from('loyalty_transactions')
    .select('*')
    .eq('customer_id', c.id)
    .order('created_at', { ascending: false })
    .limit(15)

  const level = getLevel(estrellas)
  const nextLevel = LEVELS.find((l) => l.min > estrellas)
  const progressPct = nextLevel
    ? Math.min(100, ((estrellas - level.min) / (nextLevel.min - level.min)) * 100)
    : 100

  return (
    <div className="min-h-screen bg-white pb-28">

      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <h1 className="text-gray-900 text-xl font-black">Mi cuenta</h1>
        <Link href="/configuracion" className="text-gray-400 text-sm">⚙️</Link>
      </div>

      <div className="px-4 space-y-4">

        {/* ── DOGGO CARD ── */}
        <div className="relative rounded-3xl overflow-hidden select-none"
          style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1800 55%, #0f0800 100%)' }}>

          {/* Shine overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(115deg, transparent 0%, rgba(253,196,35,0.07) 45%, transparent 80%)' }} />
          {/* Glow spots */}
          <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #FDC423 0%, transparent 70%)' }} />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #FDC423 0%, transparent 70%)' }} />

          <div className="relative p-5">

            {/* Row 1: Chip + Logo */}
            <div className="flex items-center justify-between mb-6">
              {/* EMV Chip */}
              <svg width="38" height="30" viewBox="0 0 38 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="38" height="30" rx="5" fill="url(#cg)"/>
                <rect x="15" y="0"  width="8" height="30" fill="rgba(0,0,0,0.18)"/>
                <rect x="0"  y="11" width="38" height="8"  fill="rgba(0,0,0,0.18)"/>
                <rect x="15" y="11" width="8"  height="8"  rx="1" fill="rgba(0,0,0,0.28)"/>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="38" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#C8960C"/>
                    <stop offset="0.5" stopColor="#F5CB35"/>
                    <stop offset="1" stopColor="#C8960C"/>
                  </linearGradient>
                </defs>
              </svg>
              {/* Brand */}
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm tracking-widest">🌭 DOGGO</span>
                {/* Contactless waves */}
                <svg width="14" height="18" viewBox="0 0 14 18" fill="none" className="opacity-40">
                  <path d="M2 9 Q7 3 12 9" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                  <path d="M4 9 Q7 5.5 10 9" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                  <circle cx="7" cy="9" r="1.2" fill="white"/>
                </svg>
              </div>
            </div>

            {/* Row 2: Doggo Cash balance */}
            <div className="mb-5">
              <p className="text-white/40 text-[9px] font-bold tracking-widest uppercase mb-0.5">Doggo Cash</p>
              <p className="text-doggo-yellow font-black leading-none" style={{ fontSize: '3.2rem', letterSpacing: '-1px' }}>
                ${doggo_cash.toFixed(2)}
              </p>
              <p className="text-white/30 text-[11px] mt-1">Descuento real en tu próximo pedido</p>
            </div>

            {/* Row 3: Hot dogs + progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-white font-black text-xl">{estrellas}</span>
                  <span className="text-white/60 text-sm">🌭 hot dogs</span>
                </div>
                {nextLevel ? (
                  <span className="text-white/40 text-[10px]">
                    faltan {nextLevel.min - estrellas} 🌭 para {nextLevel.emoji} {nextLevel.label}
                  </span>
                ) : (
                  <span className="text-doggo-yellow text-[10px] font-black">¡Nivel máximo! 🏆</span>
                )}
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, backgroundColor: level.color }}
                />
              </div>
              {nextLevel && (
                <div className="flex justify-between mt-1 text-[9px] text-white/25">
                  <span>{level.min} 🌭 {level.label}</span>
                  <span>{nextLevel.min} 🌭 {nextLevel.label}</span>
                </div>
              )}
            </div>

            {/* Row 4: Cardholder name + level badge */}
            <div className="flex items-center justify-between">
              <p className="text-white/50 text-[11px] font-semibold tracking-widest uppercase">
                {c.name.toUpperCase()}
              </p>
              <span className="bg-white/10 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wide">
                {level.emoji} {level.label.toUpperCase()} · ${level.rate.toFixed(2)}/🌭
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/menu"
            className="bg-doggo-yellow text-doggo-dark font-black text-sm py-3.5 rounded-2xl text-center">
            Pedir ahora
          </Link>
          <Link href="/reservas"
            className="bg-gray-100 text-gray-900 font-bold text-sm py-3.5 rounded-2xl text-center">
            Reservar mesa
          </Link>
        </div>

        {/* How it works */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-gray-900 font-black text-sm mb-3">¿Cómo funciona?</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">🛒</span>
              <div>
                <p className="text-gray-900 text-xs font-bold">Pides → ganas hot dogs</p>
                <p className="text-gray-500 text-xs">Cada $5 de tu pedido = 1 🌭. Se acumulan solos, no hay que hacer nada.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">💸</span>
              <div>
                <p className="text-gray-900 text-xs font-bold">Los 🌭 se convierten en Doggo Cash</p>
                <p className="text-gray-500 text-xs">
                  {level.emoji} {level.label}: 1 🌭 = ${level.rate.toFixed(2)} · {
                    level.label === 'Bronce' ? 'Plata (11🌭): $0.75 · Oro (26🌭): $1.00' :
                    level.label === 'Plata'  ? 'Oro (26🌭): $1.00' :
                    '¡Ya estás en el nivel máximo!'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">🎉</span>
              <div>
                <p className="text-gray-900 text-xs font-bold">Usas el Doggo Cash al pedir</p>
                <p className="text-gray-500 text-xs">En el checkout aparece tu saldo disponible. Lo usas como descuento real en tu pedido.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        {transactions && transactions.length > 0 && (
          <div>
            <h2 className="text-gray-900 font-black text-base mb-3">Mi historial</h2>
            <div className="space-y-1">
              {(transactions as (LoyaltyTransaction & { doggo_cash_amount?: number | null })[]).map((tx) => {
                const isEarned = tx.type === 'earned'
                const cashAmt = Number(tx.doggo_cash_amount ?? 0)
                return (
                  <div key={tx.id} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isEarned ? 'bg-green-50' : 'bg-doggo-red/10'}`}>
                      <span className="text-sm">{isEarned ? '🌭' : '💸'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-xs font-semibold truncate">
                        {tx.description ?? (isEarned ? 'Hot dogs ganados' : 'Doggo Cash usado')}
                      </p>
                      <p className="text-gray-400 text-[10px]">
                        {new Date(tx.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {isEarned && tx.points > 0 && (
                        <p className="text-green-600 font-black text-sm">+{tx.points} 🌭</p>
                      )}
                      {cashAmt !== 0 && (
                        <p className={`font-black text-sm ${cashAmt > 0 ? 'text-green-600' : 'text-doggo-red'}`}>
                          {cashAmt > 0 ? '+' : ''}${Math.abs(cashAmt).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(!transactions || transactions.length === 0) && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🌭</p>
            <p className="text-gray-900 font-bold">Aún no tienes hot dogs</p>
            <p className="text-gray-500 text-sm mt-1">¡Haz tu primer pedido y empieza a acumular!</p>
            <Link href="/menu" className="inline-block mt-4 bg-doggo-yellow text-doggo-dark font-black px-6 py-2.5 rounded-full text-sm">
              Ver menú
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="pt-2 pb-4">
          <LogoutButton />
        </div>

      </div>
    </div>
  )
}
