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

// Bronce 0-10 ⭐ · Plata 11-25 ⭐ · Oro 26+ ⭐
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

        {/* Main loyalty card */}
        <div className="rounded-3xl overflow-hidden bg-gray-50 border border-gray-200">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Hola de nuevo 👋</p>
                <p className="text-gray-900 text-xl font-black">{c.name.split(' ')[0]}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl">{level.emoji}</span>
                <p className="text-xs font-black mt-0.5" style={{ color: level.color }}>{level.label}</p>
              </div>
            </div>

            {/* Doggo Cash — número principal */}
            <div className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-semibold mb-0.5">DOGGO CASH</p>
                <p className="text-doggo-red text-4xl font-black leading-none">${doggo_cash.toFixed(2)}</p>
                <p className="text-gray-400 text-xs mt-1">Úsalo en tu próximo pedido</p>
              </div>
              <div className="text-right">
                <p className="text-gray-900 text-2xl font-black">{estrellas}</p>
                <p className="text-gray-400 text-[10px] font-semibold">⭐ ESTRELLAS</p>
              </div>
            </div>

            {/* Level progress */}
            {nextLevel ? (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>{level.emoji} {level.label} · ${level.rate.toFixed(2)}/⭐</span>
                  <span>{nextLevel.min - estrellas} ⭐ para {nextLevel.emoji} {nextLevel.label}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progressPct}%`, backgroundColor: level.color }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                  <span>{level.min} ⭐</span>
                  <span>{nextLevel.min} ⭐</span>
                </div>
              </div>
            ) : (
              <p className="text-doggo-red text-xs font-bold">⭐ ¡Nivel máximo Oro! Cada estrella vale $1.00 Doggo Cash</p>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 pb-5 grid grid-cols-2 gap-2">
            <Link href="/menu"
              className="bg-doggo-yellow text-doggo-dark font-black text-sm py-3 rounded-2xl text-center">
              Pedir ahora
            </Link>
            <Link href="/reservas"
              className="bg-gray-100 text-gray-900 font-bold text-sm py-3 rounded-2xl text-center">
              Reservar mesa
            </Link>
          </div>
        </div>

        {/* QR Card */}
        <div className="bg-gray-50 rounded-3xl p-5 border border-gray-200 flex flex-col items-center text-center">
          <p className="text-gray-900 font-black text-base mb-1">Mi código QR</p>
          <p className="text-gray-400 text-xs mb-4">Muéstralo en caja para sumar estrellas</p>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${c.id}&bgcolor=ffffff&color=1A1A1A&margin=4`}
              alt="Mi QR Doggo"
              width={220}
              height={220}
              className="rounded-xl"
            />
          </div>
          <p className="text-gray-400 text-[10px] mt-3 font-mono">{c.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* How it works */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-gray-900 font-black text-sm mb-3">¿Cómo funciona?</p>
          <div className="space-y-2.5">
            {[
              ['⭐', 'Cada $5 gastados = 1 estrella'],
              ['🥉', 'Bronce (0-10 ⭐): 1 estrella = $0.50 Doggo Cash'],
              ['🥈', 'Plata (11-25 ⭐): 1 estrella = $0.75 Doggo Cash'],
              ['🥇', 'Oro (26+ ⭐): 1 estrella = $1.00 Doggo Cash'],
              ['💰', 'Usa tu Doggo Cash al hacer un pedido online'],
            ].map(([emoji, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base shrink-0">{emoji}</span>
                <p className="text-gray-500 text-xs">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        {transactions && transactions.length > 0 && (
          <div>
            <h2 className="text-gray-900 font-black text-base mb-3">Historial</h2>
            <div className="space-y-1">
              {(transactions as (LoyaltyTransaction & { doggo_cash_amount?: number | null })[]).map((tx) => {
                const isEarned = tx.type === 'earned'
                const cashAmt = Number(tx.doggo_cash_amount ?? 0)
                return (
                  <div key={tx.id} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isEarned ? 'bg-green-50' : 'bg-doggo-red/10'}`}>
                      <span className="text-sm">{isEarned ? '⭐' : '💰'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-xs font-semibold truncate">
                        {tx.description ?? (isEarned ? 'Estrellas ganadas' : 'Doggo Cash usado')}
                      </p>
                      <p className="text-gray-400 text-[10px]">
                        {new Date(tx.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {isEarned && tx.points > 0 && (
                        <p className="text-green-600 font-black text-sm">+{tx.points} ⭐</p>
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
            <p className="text-gray-900 font-bold">Aún no tienes estrellas</p>
            <p className="text-gray-500 text-sm mt-1">¡Haz tu primer pedido!</p>
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
