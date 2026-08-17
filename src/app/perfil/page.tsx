export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Mi perfil · Doggo',
  description: 'Tu saldo Doggo Cash, hot dogs acumulados e historial de pedidos.',
}
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Customer, LoyaltyTransaction } from '@/types'
import LogoutButton from './LogoutButton'
import Link from 'next/link'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Si es admin/staff, redirigir al panel correspondiente
  const { data: adminProfile } = await admin.from('admin_profiles').select('role').eq('auth_user_id', user.id).single()
  if (adminProfile?.role === 'owner') redirect('/owner')
  if (adminProfile?.role === 'staff') redirect('/admin')

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

  const estrellas  = c.estrellas ?? 0
  const doggo_cash = Number(c.doggo_cash ?? 0)

  // Loyalty settings from DB
  const { data: loyaltyRows } = await admin
    .from('business_settings')
    .select('key, value')
    .in('key', ['loyalty_spend_per_hot_dog', 'loyalty_milestone_count', 'loyalty_milestone_reward'])
  const ls = Object.fromEntries((loyaltyRows ?? []).map((r) => [r.key, r.value]))
  const spendPerHotDog  = Number(ls['loyalty_spend_per_hot_dog']  ?? 5)
  const milestoneCount  = Number(ls['loyalty_milestone_count']    ?? 5)
  const milestoneReward = Number(ls['loyalty_milestone_reward']   ?? 2.50)

  // Cycle progress
  const cycleProgress = estrellas % milestoneCount   // 0 – (milestoneCount-1)
  const cyclesTotal   = Math.floor(estrellas / milestoneCount)

  const { data: transactions } = await admin
    .from('loyalty_transactions')
    .select('*')
    .eq('customer_id', c.id)
    .order('created_at', { ascending: false })
    .limit(15)

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

          {/* Shine */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(115deg, transparent 0%, rgba(253,196,35,0.07) 45%, transparent 80%)' }} />
          <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #FDC423 0%, transparent 70%)' }} />

          <div className="relative p-5">

            {/* Row 1: Chip + Logo */}
            <div className="flex items-center justify-between mb-6">
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
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm tracking-widest">🌭 DOGGO</span>
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
              <p className="text-white/30 text-[11px] mt-1">Descuento en tu próximo pedido</p>
            </div>

            {/* Row 3: Hot dog jar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/40 text-[9px] font-bold tracking-widest uppercase">Próximo premio</p>
                <p className="text-white/40 text-[9px]">{cycleProgress} de {milestoneCount} 🌭</p>
              </div>
              {/* Visual jar */}
              <div className="flex gap-1.5 mb-2">
                {Array.from({ length: milestoneCount }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-7 rounded-lg flex items-center justify-center text-base transition-all"
                    style={{
                      background: i < cycleProgress
                        ? 'rgba(253,196,35,0.25)'
                        : 'rgba(255,255,255,0.07)',
                    }}
                  >
                    <span style={{ opacity: i < cycleProgress ? 1 : 0.2 }}>🌭</span>
                  </div>
                ))}
              </div>
              <p className="text-white/30 text-[10px]">
                {cycleProgress === 0 && cyclesTotal === 0
                  ? `Cada $${spendPerHotDog} ganás 1 🌭 · Junta ${milestoneCount} → +$${milestoneReward.toFixed(2)}`
                  : cycleProgress === 0
                    ? `¡Ciclo completo! Ya vas en el ${cyclesTotal}° ciclo`
                    : `Te faltan ${milestoneCount - cycleProgress} 🌭 para +$${milestoneReward.toFixed(2)} Doggo Cash`
                }
              </p>
            </div>

            {/* Row 4: Cardholder name */}
            <div className="flex items-center justify-between">
              <p className="text-white/50 text-[11px] font-semibold tracking-widest uppercase">
                {c.name.toUpperCase()}
              </p>
              {cyclesTotal > 0 && (
                <span className="bg-white/10 text-white/60 text-[9px] font-bold px-2.5 py-1 rounded-full">
                  {cyclesTotal} {cyclesTotal === 1 ? 'ciclo' : 'ciclos'} completados
                </span>
              )}
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
                <p className="text-gray-500 text-xs">Cada ${spendPerHotDog} de tu pedido = 1 🌭. Se acumulan solos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">🎯</span>
              <div>
                <p className="text-gray-900 text-xs font-bold">Junta {milestoneCount} 🌭 → ganas ${milestoneReward.toFixed(2)}</p>
                <p className="text-gray-500 text-xs">Cuando llegás a {milestoneCount} hot dogs, te caen ${milestoneReward.toFixed(2)} de Doggo Cash automáticamente. El contador vuelve a cero.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">💸</span>
              <div>
                <p className="text-gray-900 text-xs font-bold">Usas el Doggo Cash al pedir</p>
                <p className="text-gray-500 text-xs">En el checkout aparece tu saldo. Lo aplicas como descuento real. Se acumula hasta que lo quieras usar.</p>
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
                const cashAmt  = Number(tx.doggo_cash_amount ?? 0)
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
            <p className="text-gray-500 text-sm mt-1">Haz tu primer pedido y empieza a acumular.</p>
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
