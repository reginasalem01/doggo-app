'use client'

import { useEffect, useState } from 'react'

type Settings = {
  orders_enabled: string
  orders_open_time: string
  orders_close_time: string
  whatsapp_number: string
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Settings>({
    orders_enabled: 'true',
    orders_open_time: '11:00',
    orders_close_time: '19:00',
    whatsapp_number: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/owner/settings')
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
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

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Cargando…
      </div>
    )
  }

  const isOpen = settings.orders_enabled === 'true'

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-gray-900 text-2xl font-black">Configuración</h1>

      {/* Pedidos en línea */}
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

      {/* Horario */}
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

      {/* WhatsApp */}
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
    </div>
  )
}
