'use client'

import { useEffect, useState } from 'react'

type Settings = {
  orders_enabled: string
  orders_open_time: string
  orders_close_time: string
}

type ContificoTestResult = {
  ok: boolean
  env_missing?: boolean
  message?: string
  results?: {
    products_count?: number
    first_product?: { id: string; nombre: string; precio_venta: number } | null
    all_products?: { id: string; nombre: string }[]
    products_error?: string
    document_created?: { id: string; documento: string; estado: string }
    document_error?: string
    document_skipped?: string
  }
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Settings>({
    orders_enabled: 'true',
    orders_open_time: '11:00',
    orders_close_time: '19:00',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contificoTest, setContificoTest] = useState<ContificoTestResult | null>(null)
  const [testingContifico, setTestingContifico] = useState(false)

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

  function toggle(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function testContifico() {
    setTestingContifico(true)
    setContificoTest(null)
    try {
      const res = await fetch('/api/contifico/test')
      const data = await res.json()
      setContificoTest(data)
    } catch {
      setContificoTest({ ok: false, message: 'Error de red al contactar /api/contifico/test' })
    } finally {
      setTestingContifico(false)
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

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-gray-900 text-2xl font-black">Configuración</h1>

      {/* Orders enabled toggle */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-900 font-black text-base">Pedidos en línea</p>
            <p className="text-gray-400 text-xs mt-0.5">Activa o desactiva los pedidos independientemente del horario</p>
          </div>
          <button
            onClick={() => toggle('orders_enabled', isOpen ? 'false' : 'true')}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isOpen ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                isOpen ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
          isOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-doggo-red'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-doggo-red'}`} />
          {isOpen ? 'Aceptando pedidos según horario' : 'Pedidos desactivados — no se aceptan órdenes'}
        </div>
      </div>

      {/* Business hours */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-gray-900 font-black text-base">Horario de pedidos</p>
          <p className="text-gray-400 text-xs mt-0.5">
            Aplica todos los días. Fuera de este rango no se aceptan pedidos.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-500 text-xs font-semibold mb-1.5 uppercase tracking-wide">
              Apertura
            </label>
            <input
              type="time"
              value={settings.orders_open_time}
              onChange={(e) => toggle('orders_open_time', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
            />
          </div>
          <div>
            <label className="block text-gray-500 text-xs font-semibold mb-1.5 uppercase tracking-wide">
              Cierre
            </label>
            <input
              type="time"
              value={settings.orders_close_time}
              onChange={(e) => toggle('orders_close_time', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
            />
          </div>
        </div>

        <p className="text-gray-400 text-xs">
          Horario actual:{' '}
          <span className="font-semibold text-gray-600">
            {settings.orders_open_time} – {settings.orders_close_time}
          </span>{' '}
          (hora Ecuador, UTC-5)
        </p>
      </div>

      {/* Contífico integration test */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-gray-900 font-black text-base">Contífico — Facturación electrónica</p>
          <p className="text-gray-400 text-xs mt-0.5">
            Prueba la conexión con Contífico. Si funciona, las facturas se crearán automáticamente cuando marques un pedido como entregado.
          </p>
        </div>

        <button
          onClick={testContifico}
          disabled={testingContifico}
          className="bg-gray-100 text-gray-700 font-bold px-5 py-2.5 rounded-full text-sm disabled:opacity-50 transition-opacity hover:bg-gray-200"
        >
          {testingContifico ? 'Probando…' : '🔌 Probar conexión Contífico'}
        </button>

        {contificoTest && (
          <div className={`rounded-xl p-4 text-xs space-y-2 ${
            contificoTest.env_missing
              ? 'bg-amber-50 border border-amber-200'
              : contificoTest.results?.document_created
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {contificoTest.env_missing ? (
              <>
                <p className="font-black text-amber-800">⚠️ Variables de entorno faltantes</p>
                <p className="text-amber-700">{contificoTest.message}</p>
                <p className="text-amber-600">Verifica que <code className="bg-amber-100 px-1 rounded">CONTIFICO_API_KEY</code> y <code className="bg-amber-100 px-1 rounded">CONTIFICO_API_TOKEN</code> estén en el <code>.env.local</code> y reinicia el servidor con <code>npm run dev</code>.</p>
              </>
            ) : contificoTest.results?.products_count !== undefined && !contificoTest.results?.products_error ? (
              <>
                <p className="font-black text-green-800">✅ Conexión con Contífico exitosa</p>
                <p className="text-green-700">Productos en catálogo: <strong>{contificoTest.results.products_count}</strong></p>
                {contificoTest.results.all_products && contificoTest.results.all_products.length > 0 && (
                  <div className="mt-1 space-y-1">
                    <p className="text-green-700 font-semibold">Productos disponibles:</p>
                    {contificoTest.results.all_products.map((p) => (
                      <p key={p.id} className="text-green-700 font-mono bg-green-100 rounded px-2 py-0.5">
                        {p.nombre} → <strong>{p.id}</strong>
                      </p>
                    ))}
                  </div>
                )}
                {contificoTest.results.document_created && (
                  <p className="text-green-700 mt-1">
                    Factura de prueba creada: <strong>{contificoTest.results.document_created.documento}</strong>
                  </p>
                )}
                {contificoTest.results.document_skipped && (
                  <p className="text-amber-700 mt-1 bg-amber-50 rounded px-2 py-1">
                    ⚠️ {contificoTest.results.document_skipped}
                  </p>
                )}
                {contificoTest.results.document_error && (
                  <p className="text-red-700 mt-1">Error factura: {contificoTest.results.document_error}</p>
                )}
              </>
            ) : (
              <>
                <p className="font-black text-red-800">❌ Error de conexión</p>
                {contificoTest.results?.products_error && (
                  <p className="text-red-700">Productos: {contificoTest.results.products_error}</p>
                )}
                {contificoTest.results?.document_error && (
                  <p className="text-red-700">Factura: {contificoTest.results.document_error}</p>
                )}
                <p className="text-red-600">Verifica que <code className="bg-red-100 px-1 rounded">CONTIFICO_API_KEY</code> y <code className="bg-red-100 px-1 rounded">CONTIFICO_API_TOKEN</code> sean correctos.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      {error && (
        <p className="text-doggo-red text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

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
