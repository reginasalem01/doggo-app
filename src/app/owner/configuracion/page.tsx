'use client'

import { useEffect, useState } from 'react'

type LoyaltySettings = {
  loyalty_spend_per_hot_dog: string
  loyalty_rate_bronce: string
  loyalty_rate_plata: string
  loyalty_rate_oro: string
  loyalty_threshold_plata: string
  loyalty_threshold_oro: string
}

type Settings = {
  orders_enabled: string
  orders_open_time: string
  orders_close_time: string
  whatsapp_number: string
} & LoyaltySettings

const LOYALTY_DEFAULTS: LoyaltySettings = {
  loyalty_spend_per_hot_dog: '5',
  loyalty_rate_bronce: '0.50',
  loyalty_rate_plata: '0.75',
  loyalty_rate_oro: '1.00',
  loyalty_threshold_plata: '11',
  loyalty_threshold_oro: '26',
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Settings>({
    orders_enabled: 'true',
    orders_open_time: '11:00',
    orders_close_time: '19:00',
    whatsapp_number: '',
    ...LOYALTY_DEFAULTS,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Loyalty section state
  const [loyaltyEditing, setLoyaltyEditing] = useState(false)
  const [loyaltySaving, setLoyaltySaving] = useState(false)
  const [loyaltySaved, setLoyaltySaved] = useState(false)
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null)
  const [loyaltySnapshot, setLoyaltySnapshot] = useState<LoyaltySettings>(LOYALTY_DEFAULTS)

  useEffect(() => {
    fetch('/api/owner/settings')
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // General settings save (orders + horario + whatsapp only)
  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders_enabled:   settings.orders_enabled,
          orders_open_time: settings.orders_open_time,
          orders_close_time: settings.orders_close_time,
          whatsapp_number:  settings.whatsapp_number,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  function set(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // Loyalty edit guard
  function startEditLoyalty() {
    setLoyaltySnapshot({
      loyalty_spend_per_hot_dog: settings.loyalty_spend_per_hot_dog,
      loyalty_rate_bronce:       settings.loyalty_rate_bronce,
      loyalty_rate_plata:        settings.loyalty_rate_plata,
      loyalty_rate_oro:          settings.loyalty_rate_oro,
      loyalty_threshold_plata:   settings.loyalty_threshold_plata,
      loyalty_threshold_oro:     settings.loyalty_threshold_oro,
    })
    setLoyaltyEditing(true)
    setLoyaltyError(null)
  }

  function cancelEditLoyalty() {
    setSettings((prev) => ({ ...prev, ...loyaltySnapshot }))
    setLoyaltyEditing(false)
    setLoyaltyError(null)
  }

  async function saveLoyalty() {
    setLoyaltySaving(true)
    setLoyaltyError(null)
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_spend_per_hot_dog: settings.loyalty_spend_per_hot_dog,
          loyalty_rate_bronce:       settings.loyalty_rate_bronce,
          loyalty_rate_plata:        settings.loyalty_rate_plata,
          loyalty_rate_oro:          settings.loyalty_rate_oro,
          loyalty_threshold_plata:   settings.loyalty_threshold_plata,
          loyalty_threshold_oro:     settings.loyalty_threshold_oro,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setLoyaltySaved(true)
      setLoyaltyEditing(false)
      setTimeout(() => setLoyaltySaved(false), 4000)
    } catch (e: unknown) {
      setLoyaltyError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoyaltySaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Cargando…
      </div>
    )
  }

  const isOpen = settings.orders_enabled === 'true'
  const tPlata = Number(settings.loyalty_threshold_plata)
  const tOro   = Number(settings.loyalty_threshold_oro)

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-gray-900 text-2xl font-black">Configuración</h1>

      {/* ── Pedidos en línea ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-900 font-black text-base">Pedidos en línea</p>
            <p className="text-gray-400 text-xs mt-0.5">Activa o desactiva los pedidos independientemente del horario</p>
          </div>
          <button
            onClick={() => set('orders_enabled', isOpen ? 'false' : 'true')}
            className={`relative w-12 h-6 rounded-full transition-colors ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isOpen ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${isOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-doggo-red'}`}>
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-doggo-red'}`} />
          {isOpen ? 'Aceptando pedidos según horario' : 'Pedidos desactivados — no se aceptan órdenes'}
        </div>
      </div>

      {/* ── Horario ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-gray-900 font-black text-base">Horario de pedidos</p>
          <p className="text-gray-400 text-xs mt-0.5">Aplica todos los días. Fuera de este rango no se aceptan pedidos.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-500 text-xs font-semibold mb-1.5 uppercase tracking-wide">Apertura</label>
            <input
              type="time"
              value={settings.orders_open_time}
              onChange={(e) => set('orders_open_time', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
            />
          </div>
          <div>
            <label className="block text-gray-500 text-xs font-semibold mb-1.5 uppercase tracking-wide">Cierre</label>
            <input
              type="time"
              value={settings.orders_close_time}
              onChange={(e) => set('orders_close_time', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
            />
          </div>
        </div>
        <p className="text-gray-400 text-xs">
          Horario actual:{' '}
          <span className="font-semibold text-gray-600">{settings.orders_open_time} – {settings.orders_close_time}</span>{' '}
          (hora Ecuador, UTC-5)
        </p>
      </div>

      {/* ── WhatsApp ─────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-gray-900 font-black text-base">WhatsApp del negocio</p>
          <p className="text-gray-400 text-xs mt-0.5">
            Número que aparece en la app para que los clientes te contacten.
            Formato: <span className="font-mono">593XXXXXXXXX</span> (código de país sin el +)
          </p>
        </div>
        <input
          type="tel"
          value={settings.whatsapp_number}
          onChange={(e) => set('whatsapp_number', e.target.value.replace(/\s/g, ''))}
          placeholder="593XXXXXXXXX"
          className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 font-mono"
        />
        {settings.whatsapp_number && (
          <a
            href={`https://wa.me/${settings.whatsapp_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-green-700 text-xs font-semibold hover:underline"
          >
            💬 Probar enlace →
          </a>
        )}
      </div>

      {error && <p className="text-doggo-red text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="bg-doggo-yellow text-doggo-dark font-black px-8 py-3 rounded-full text-sm disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>

      {/* ── Reglas de Fidelización ───────────────────────── */}
      <div className={`bg-white border rounded-2xl p-5 space-y-4 transition-colors ${loyaltyEditing ? 'border-doggo-yellow shadow-sm' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-900 font-black text-base">🌭 Reglas de Fidelización</p>
            <p className="text-gray-400 text-xs mt-0.5">Cómo los clientes acumulan hot dogs y Doggo Cash</p>
          </div>
          {!loyaltyEditing && (
            <button
              onClick={startEditLoyalty}
              className="text-xs font-bold text-doggo-red border border-doggo-red/30 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-doggo-red hover:text-white transition-colors"
            >
              ✏️ Editar
            </button>
          )}
        </div>

        {!loyaltyEditing ? (
          /* ── Vista bloqueada (solo lectura) ── */
          <div className="space-y-3">
            <div className="bg-doggo-yellow/10 border border-doggo-yellow/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🛒</span>
              <p className="text-gray-900 font-bold text-sm">
                Cada <span className="text-doggo-red">${settings.loyalty_spend_per_hot_dog}</span> de compra = 1 🌭
              </p>
            </div>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
              {[
                { emoji: '🥉', label: 'Bronce', range: `0 – ${tPlata - 1}`, rate: settings.loyalty_rate_bronce },
                { emoji: '🥈', label: 'Plata',  range: `${tPlata} – ${tOro - 1}`,   rate: settings.loyalty_rate_plata  },
                { emoji: '🥇', label: 'Oro',    range: `${tOro}+`,              rate: settings.loyalty_rate_oro    },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3 bg-white">
                  <span className="text-gray-700 text-sm">
                    {row.emoji} <span className="font-semibold">{row.label}</span>{' '}
                    <span className="text-gray-400 text-xs">({row.range} 🌭)</span>
                  </span>
                  <span className="text-gray-900 font-black text-sm">${row.rate} / 🌭</span>
                </div>
              ))}
            </div>
            {loyaltySaved && (
              <p className="text-green-600 text-xs font-semibold text-center py-1">✓ Reglas guardadas correctamente</p>
            )}
          </div>
        ) : (
          /* ── Modo edición ── */
          <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-xs font-semibold">
              ⚠️ Cambiar estos valores afecta a todos los pedidos futuros. Los puntos ya acumulados no se ven afectados.
            </div>

            {/* Gasto por hot dog */}
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wide">
                ¿Cuántos dólares de compra = 1 🌭?
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm font-semibold">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={settings.loyalty_spend_per_hot_dog}
                  onChange={(e) => set('loyalty_spend_per_hot_dog', e.target.value)}
                  className="w-24 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
                />
                <span className="text-gray-400 text-sm">= 1 🌭</span>
              </div>
            </div>

            {/* Tasas por nivel */}
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wide">
                Doggo Cash que se gana por cada 🌭 (según nivel)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'loyalty_rate_bronce' as keyof Settings, emoji: '🥉', label: 'Bronce' },
                  { key: 'loyalty_rate_plata'  as keyof Settings, emoji: '🥈', label: 'Plata'  },
                  { key: 'loyalty_rate_oro'    as keyof Settings, emoji: '🥇', label: 'Oro'    },
                ].map((lvl) => (
                  <div key={lvl.key}>
                    <p className="text-xs text-gray-500 mb-1.5">{lvl.emoji} {lvl.label}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={settings[lvl.key]}
                        onChange={(e) => set(lvl.key, e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Umbrales */}
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wide">
                ¿A partir de cuántos 🌭 sube de nivel?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">🥈 Plata desde (🌭)</p>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={settings.loyalty_threshold_plata}
                    onChange={(e) => set('loyalty_threshold_plata', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">🥇 Oro desde (🌭)</p>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={settings.loyalty_threshold_oro}
                    onChange={(e) => set('loyalty_threshold_oro', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
                  />
                </div>
              </div>
              <p className="text-gray-400 text-[10px] mt-2">
                Bronce: 0 – {settings.loyalty_threshold_plata ? Number(settings.loyalty_threshold_plata) - 1 : '?'} 🌭 ·{' '}
                Plata: {settings.loyalty_threshold_plata} – {settings.loyalty_threshold_oro ? Number(settings.loyalty_threshold_oro) - 1 : '?'} 🌭 ·{' '}
                Oro: {settings.loyalty_threshold_oro}+ 🌭
              </p>
            </div>

            {loyaltyError && (
              <p className="text-doggo-red text-sm bg-red-50 rounded-xl px-4 py-3">{loyaltyError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={cancelEditLoyalty}
                className="flex-1 border border-gray-200 text-gray-600 font-bold px-4 py-2.5 rounded-full text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveLoyalty}
                disabled={loyaltySaving}
                className="flex-1 bg-doggo-yellow text-doggo-dark font-black px-4 py-2.5 rounded-full text-sm disabled:opacity-50 transition-opacity"
              >
                {loyaltySaving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
