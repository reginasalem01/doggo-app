'use client'

import { useEffect, useRef, useState } from 'react'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  points: number
}

interface Reward {
  id: string
  name: string
  description: string | null
  points_required: number
  discount_type: string | null
  discount_value: number | null
}

type State =
  | { phase: 'scanning' }
  | { phase: 'loading' }
  | { phase: 'found'; customer: Customer; rewards: Reward[] }
  | { phase: 'error'; message: string }
  | { phase: 'success'; message: string; newPoints: number }

export default function QRScanner() {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrRef = useRef<unknown>(null)
  const [state, setState] = useState<State>({ phase: 'scanning' })
  const [pointsInput, setPointsInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (state.phase !== 'scanning') return

    let stopped = false

    async function startScanner() {
      const { Html5Qrcode } = await import('html5-qrcode')
      const qr = new Html5Qrcode('qr-reader')
      html5QrRef.current = qr

      try {
        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText: string) => {
            if (stopped) return
            stopped = true
            try { await qr.stop() } catch { /* already stopped */ }
            setState({ phase: 'loading' })
            try {
              const res = await fetch(`/api/staff/customer/${decodedText}`)
              if (!res.ok) throw new Error('Cliente no encontrado')
              const data = await res.json()
              setState({ phase: 'found', customer: data.customer, rewards: data.rewards })
            } catch {
              setState({ phase: 'error', message: 'QR no válido o cliente no encontrado' })
            }
          },
          () => { /* ignore scan errors */ }
        )
      } catch {
        // camera permission denied or not available
        setState({ phase: 'error', message: 'No se pudo acceder a la cámara. Verifica los permisos.' })
      }
    }

    startScanner()

    return () => {
      if (!stopped) {
        stopped = true
        const qr = html5QrRef.current as { stop: () => Promise<void> } | null
        qr?.stop().catch(() => {})
      }
    }
  }, [state.phase])

  async function addPoints() {
    if (state.phase !== 'found') return
    const pts = parseInt(pointsInput)
    if (!pts || pts <= 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/staff/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: state.customer.id,
          points: pts,
          description: `Puntos por compra en local ($${pts})`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState({ phase: 'success', message: `+${pts} puntos agregados a ${state.customer.name.split(' ')[0]}`, newPoints: data.newPoints })
    } catch (e: unknown) {
      setState({ phase: 'error', message: e instanceof Error ? e.message : 'Error' })
    } finally {
      setLoading(false)
    }
  }

  async function redeemReward(reward: Reward) {
    if (state.phase !== 'found') return
    setLoading(true)
    try {
      const res = await fetch('/api/staff/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: state.customer.id, rewardId: reward.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState({ phase: 'success', message: `Premio "${reward.name}" canjeado para ${state.customer.name.split(' ')[0]}`, newPoints: data.newPoints })
    } catch (e: unknown) {
      setState({ phase: 'error', message: e instanceof Error ? e.message : 'Error' })
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setPointsInput('')
    setState({ phase: 'scanning' })
  }

  // ── SCANNING ──────────────────────────────────────────────
  if (state.phase === 'scanning') {
    return (
      <div className="flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-4 text-center">Apunta la cámara al QR del cliente</p>
        <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ width: 300, height: 300 }}>
          <div id="qr-reader" ref={scannerRef} style={{ width: 300, height: 300 }} />
        </div>
      </div>
    )
  }

  // ── LOADING ───────────────────────────────────────────────
  if (state.phase === 'loading') {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="w-10 h-10 border-4 border-doggo-yellow border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Buscando cliente…</p>
      </div>
    )
  }

  // ── SUCCESS ───────────────────────────────────────────────
  if (state.phase === 'success') {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <p className="text-gray-900 font-black text-lg mb-1">{state.message}</p>
        <p className="text-gray-500 text-sm">Total acumulado: <span className="font-black text-doggo-red">{state.newPoints} pts</span></p>
        <button onClick={reset} className="mt-6 bg-doggo-yellow text-doggo-dark font-black px-6 py-3 rounded-full text-sm">
          Escanear otro
        </button>
      </div>
    )
  }

  // ── ERROR ─────────────────────────────────────────────────
  if (state.phase === 'error') {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">❌</span>
        </div>
        <p className="text-gray-900 font-black text-lg mb-1">Ups</p>
        <p className="text-gray-500 text-sm">{state.message}</p>
        <button onClick={reset} className="mt-6 bg-doggo-yellow text-doggo-dark font-black px-6 py-3 rounded-full text-sm">
          Intentar de nuevo
        </button>
      </div>
    )
  }

  // ── FOUND ─────────────────────────────────────────────────
  const { customer, rewards } = state

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      {/* Customer card */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-doggo-red/10 flex items-center justify-center shrink-0">
            <span className="text-doggo-red font-black text-lg">
              {customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-gray-900 font-black text-base">{customer.name}</p>
            {customer.phone && <p className="text-gray-500 text-xs">{customer.phone}</p>}
          </div>
          <div className="ml-auto text-right">
            <p className="text-doggo-red font-black text-2xl">{customer.points}</p>
            <p className="text-gray-400 text-[10px]">puntos</p>
          </div>
        </div>
      </div>

      {/* Add points */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <p className="text-gray-900 font-black text-sm mb-3">Sumar puntos</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="1"
              placeholder="Monto gastado"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-doggo-yellow bg-white"
            />
          </div>
          <button
            onClick={addPoints}
            disabled={loading || !pointsInput}
            className="bg-doggo-yellow text-doggo-dark font-black px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
          >
            {loading ? '…' : '+Pts'}
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-2">1 punto por cada $1 gastado</p>
      </div>

      {/* Rewards to redeem */}
      {rewards.length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-gray-900 font-black text-sm mb-3">Premios disponibles para canjear</p>
          <div className="space-y-2">
            {rewards.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-doggo-yellow/30">
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{r.name}</p>
                  <p className="text-doggo-red font-bold text-xs">{r.points_required} pts</p>
                </div>
                <button
                  onClick={() => redeemReward(r)}
                  disabled={loading}
                  className="bg-doggo-red text-white font-black text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  Canjear
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {rewards.length === 0 && (
        <p className="text-gray-400 text-xs text-center">El cliente no tiene premios disponibles aún</p>
      )}

      <button onClick={reset} className="w-full text-gray-400 text-sm font-semibold py-2">
        ← Escanear otro cliente
      </button>
    </div>
  )
}
