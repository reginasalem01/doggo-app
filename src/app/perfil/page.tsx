import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Customer, LoyaltyTransaction, Reward } from '@/types'
import LogoutButton from './LogoutButton'
import Link from 'next/link'

const LEVELS = [
  { label: 'Bronce', emoji: '🥉', min: 0,   max: 200,  color: '#CD7F32' },
  { label: 'Plata',  emoji: '🥈', min: 200,  max: 500,  color: '#A8A9AD' },
  { label: 'Oro',    emoji: '🥇', min: 500,  max: null, color: '#F5C400' },
]

function getLevel(points: number) {
  return LEVELS.findLast((l) => points >= l.min) ?? LEVELS[0]
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
        .from('customers').insert({ auth_user_id: user.id, name, email: user.email, points: 0 }).select().single()
      customer = newCustomer
    }
  }

  if (!customer) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-900">No se pudo cargar el perfil</p>
    </div>
  )

  const c = customer as Customer

  const today = new Date().toISOString().split('T')[0]
  const [{ data: transactions }, { data: rewards }] = await Promise.all([
    admin.from('loyalty_transactions').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(10),
    admin.from('rewards').select('*').eq('active', true).or(`expires_at.is.null,expires_at.gte.${today}`).order('points_required'),
  ])

  const level = getLevel(c.points)
  const nextLevel = LEVELS.find((l) => l.min > c.points)
  const progressPct = nextLevel
    ? Math.min(100, ((c.points - level.min) / (nextLevel.min - level.min)) * 100)
    : 100

  // Next reachable reward
  const nextReward = (rewards as Reward[] | null)?.find((r) => r.points_required > c.points)

  return (
    <div className="min-h-screen bg-white pb-8">

      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <h1 className="text-gray-900 text-xl font-black">Mi cuenta</h1>
        <div className="flex items-center gap-3">
          <Link href="/configuracion" className="text-gray-400 text-sm">⚙️</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* Main loyalty card */}
        <div className="rounded-3xl overflow-hidden bg-gray-50 border border-gray-200">
          {/* Top section */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Hola de nuevo 👋</p>
                <p className="text-gray-900 text-xl font-black">{c.name.split(' ')[0]}</p>
              </div>
              <span className="text-3xl">{level.emoji}</span>
            </div>

            {/* Points */}
            <div className="mb-4">
              <p className="text-doggo-red text-6xl font-black leading-none tracking-tight">{c.points}</p>
              <p className="text-gray-500 text-sm font-semibold mt-1">PUNTOS TOTALES</p>
            </div>

            {/* Progress bar */}
            {nextLevel ? (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>{level.emoji} {level.label}</span>
                  <span>{nextLevel.min - c.points} pts para {nextLevel.emoji} {nextLevel.label}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progressPct}%`, backgroundColor: level.color }}
                  />
                </div>
                {/* Milestones */}
                <div className="flex justify-between mt-1">
                  {LEVELS.filter(l => l.min <= nextLevel.min).map((l) => (
                    <span key={l.label} className="text-[9px] text-gray-400">{l.min}</span>
                  ))}
                  <span className="text-[9px] text-gray-400">{nextLevel.min}</span>
                </div>
              </div>
            ) : (
              <p className="text-doggo-red text-xs font-bold">⭐ Nivel máximo — ¡eres Oro!</p>
            )}
          </div>

          {/* Next reward teaser */}
          {nextReward && (
            <div className="mx-4 mb-4 bg-doggo-yellow/10 border border-doggo-yellow/20 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Próximo premio</p>
                <p className="text-gray-900 font-bold text-sm">{nextReward.name}</p>
              </div>
              <p className="text-doggo-red font-black text-sm">{nextReward.points_required - c.points} pts más</p>
            </div>
          )}

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
          <p className="text-gray-400 text-xs mb-4">Muéstralo en caja para sumar puntos o canjear un premio</p>
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

        {/* Rewards list */}
        {rewards && rewards.length > 0 && (
          <div>
            <h2 className="text-gray-900 font-black text-base mb-3">Tus premios</h2>
            <div className="space-y-2">
              {(rewards as Reward[]).map((reward) => {
                const canRedeem = c.points >= reward.points_required
                const missing = reward.points_required - c.points
                const expiresStr = reward.expires_at
                  ? new Date(reward.expires_at + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
                  : null

                return (
                  <div key={reward.id} className={`rounded-2xl p-4 flex items-center gap-3 border ${canRedeem ? 'bg-gray-50 border-doggo-yellow/30' : 'bg-gray-50 border-gray-200'}`}>
                    {/* Points badge */}
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${canRedeem ? 'bg-doggo-yellow' : 'bg-gray-100'}`}>
                      <p className={`font-black text-xs leading-none ${canRedeem ? 'text-doggo-dark' : 'text-gray-500'}`}>{reward.points_required}</p>
                      <p className={`text-[8px] font-bold ${canRedeem ? 'text-doggo-dark/70' : 'text-gray-400'}`}>PTS</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-bold text-sm">{reward.name}</p>
                      {reward.description && <p className="text-gray-500 text-xs mt-0.5 truncate">{reward.description}</p>}
                      {expiresStr && <p className="text-gray-400 text-xs mt-0.5">Vence {expiresStr}</p>}
                      {!canRedeem && <p className="text-gray-400 text-xs mt-0.5">Te faltan {missing} pts</p>}
                    </div>
                    {canRedeem && (
                      <span className="text-green-600 text-xs font-black shrink-0">¡Listo!</span>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-gray-400 text-xs mt-2 text-center">Aplica tu premio al hacer un pedido</p>
          </div>
        )}

        {/* How to earn */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-gray-900 font-black text-sm mb-3">¿Cómo gano puntos?</p>
          <div className="space-y-2">
            {[
              ['🛍️', 'Cada $1 gastado = 1 punto'],
              ['✅', 'Puntos se suman cuando el pedido es entregado'],
              ['🏆', 'Bronce (0) → Plata (200) → Oro (500)'],
            ].map(([emoji, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-lg shrink-0">{emoji}</span>
                <p className="text-gray-500 text-xs">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        {transactions && transactions.length > 0 && (
          <div>
            <h2 className="text-gray-900 font-black text-base mb-3">Historial</h2>
            <div className="space-y-1">
              {(transactions as LoyaltyTransaction[]).map((tx) => (
                <div key={tx.id} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'earned' ? 'bg-green-50' : 'bg-doggo-red/10'}`}>
                    <span className="text-xs">{tx.type === 'earned' ? '↑' : '↓'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-xs font-semibold truncate">
                      {tx.description ?? (tx.type === 'earned' ? 'Puntos ganados' : 'Canje')}
                    </p>
                    <p className="text-gray-400 text-[10px]">
                      {new Date(tx.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`font-black text-sm shrink-0 ${tx.type === 'earned' ? 'text-green-600' : 'text-doggo-red'}`}>
                    {tx.type === 'earned' ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!transactions || transactions.length === 0) && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🌭</p>
            <p className="text-gray-900 font-bold">Aún no tienes puntos</p>
            <p className="text-gray-500 text-sm mt-1">¡Haz tu primer pedido!</p>
            <Link href="/menu" className="inline-block mt-4 bg-doggo-yellow text-doggo-dark font-black px-6 py-2.5 rounded-full text-sm">
              Ver menú
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
