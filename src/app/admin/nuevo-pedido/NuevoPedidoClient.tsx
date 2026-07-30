'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category { id: string; name: string; sort_order: number }
interface Product  { id: string; name: string; price: number; category_id: string | null; image_url: string | null }
interface OrderItem { product: Product; qty: number }
interface LinkedCustomer { id: string; name: string; points: number }

export default function NuevoPedidoClient({
  categories,
  products,
}: {
  categories: Category[]
  products: Product[]
}) {
  const router = useRouter()
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [linkedCustomer, setLinkedCustomer] = useState<LinkedCustomer | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const filtered = activeCat
    ? products.filter((p) => p.category_id === activeCat)
    : products

  const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0)
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0)

  function addItem(product: Product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
  }

  function changeQty(productId: string, delta: number) {
    setItems((prev) => {
      return prev
        .map((i) => i.product.id === productId ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    })
  }

  async function handleCreate() {
    if (!items.length) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/admin/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.qty })),
          linked_customer_id: linkedCustomer?.id ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      router.push('/admin')
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Error al crear pedido')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT: Products ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">

        {/* Category tabs */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto shrink-0 border-b border-gray-100 bg-white">
          <button
            onClick={() => setActiveCat(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${
              activeCat === null ? 'bg-doggo-yellow text-doggo-dark' : 'bg-gray-100 text-gray-500'
            }`}
          >
            Todo
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${
                activeCat === c.id ? 'bg-doggo-yellow text-doggo-dark' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
          {filtered.map((product) => {
            const inCart = items.find((i) => i.product.id === product.id)
            return (
              <button
                key={product.id}
                onClick={() => addItem(product)}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-left flex flex-col gap-2 active:scale-[0.98] transition-transform"
              >
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} className="w-full h-24 object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center text-4xl">🌭</div>
                )}
                <div>
                  <p className="text-gray-900 font-bold text-sm leading-tight">{product.name}</p>
                  <p className="text-doggo-red font-black text-base mt-0.5">${product.price.toFixed(2)}</p>
                </div>
                {inCart && (
                  <div className="bg-doggo-yellow text-doggo-dark text-xs font-black px-2 py-0.5 rounded-full self-start">
                    {inCart.qty} en pedido
                  </div>
                )}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 py-16 text-center text-gray-400">
              <p className="text-4xl mb-2">🌭</p>
              <p className="font-semibold">Sin productos</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Order summary ────────────────────────────────── */}
      <div className="w-80 shrink-0 flex flex-col bg-white overflow-hidden">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-gray-900 font-black text-base">Pedido en local</p>
          <p className="text-gray-400 text-xs">{itemCount} producto{itemCount !== 1 ? 's' : ''}</p>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">👆</p>
              <p className="text-sm">Toca un producto para agregar</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm truncate">{item.product.name}</p>
                  <p className="text-gray-400 text-xs">${item.product.price.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => changeQty(item.product.id, -1)}
                    className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center"
                  >−</button>
                  <span className="text-gray-900 font-black text-sm w-5 text-center">{item.qty}</span>
                  <button
                    onClick={() => changeQty(item.product.id, 1)}
                    className="w-7 h-7 rounded-full bg-doggo-yellow text-doggo-dark font-bold text-sm flex items-center justify-center"
                  >+</button>
                </div>
                <p className="text-doggo-red font-black text-sm shrink-0 w-14 text-right">
                  ${(item.product.price * item.qty).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Customer QR link */}
        <div className="px-4 py-3 border-t border-gray-100">
          {linkedCustomer ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-black text-green-700 shrink-0">
                {linkedCustomer.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-bold text-sm truncate">{linkedCustomer.name}</p>
                <p className="text-green-600 text-xs">{linkedCustomer.points} pts actuales</p>
              </div>
              <button onClick={() => setLinkedCustomer(null)} className="text-gray-400 text-lg leading-none">×</button>
            </div>
          ) : (
            <button
              onClick={() => { setScanning(true); setScanError(null) }}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-gray-400 text-sm font-semibold hover:border-doggo-yellow hover:text-doggo-dark transition-colors"
            >
              📲 Vincular cliente con QR
            </button>
          )}
          {!linkedCustomer && (
            <p className="text-gray-400 text-xs mt-1.5 text-center">Opcional — para otorgarle puntos</p>
          )}
        </div>

        {/* Total + create */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-semibold text-sm">Total</span>
            <span className="text-doggo-red font-black text-xl">${total.toFixed(2)}</span>
          </div>
          {createError && <p className="text-doggo-red text-xs text-center">{createError}</p>}
          <button
            onClick={handleCreate}
            disabled={creating || items.length === 0}
            className="w-full bg-doggo-yellow text-doggo-dark font-black py-3 rounded-full text-sm disabled:opacity-50 transition-opacity"
          >
            {creating ? 'Creando pedido…' : linkedCustomer ? `Crear pedido + puntos para ${linkedCustomer.name.split(' ')[0]}` : 'Crear pedido'}
          </button>
          <button
            onClick={() => { setItems([]); setLinkedCustomer(null) }}
            className="w-full text-gray-400 text-xs py-1"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* ── QR Scanner overlay ─────────────────────────────────── */}
      {scanning && (
        <QRScanOverlay
          onFound={async (customerId) => {
            setScanError(null)
            const res = await fetch(`/api/staff/customer/${customerId}`)
            if (!res.ok) {
              setScanError('QR no válido o cliente sin cuenta Doggo')
              return false
            }
            const data = await res.json()
            setLinkedCustomer(data.customer)
            setScanning(false)
            return true
          }}
          onError={(msg) => setScanError(msg)}
          onClose={() => setScanning(false)}
          error={scanError}
        />
      )}
    </div>
  )
}

// ── QR Scanner overlay component ─────────────────────────────────────────────
function QRScanOverlay({
  onFound,
  onError,
  onClose,
  error,
}: {
  onFound: (id: string) => Promise<boolean>
  onError: (msg: string) => void
  onClose: () => void
  error: string | null
}) {
  const ref = useRef<HTMLDivElement>(null)
  const html5Ref = useRef<unknown>(null)
  const [loading, setLoading] = useState(false)
  const stoppedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function start() {
      const { Html5Qrcode } = await import('html5-qrcode')
      const qr = new Html5Qrcode('nuevo-pedido-qr')
      html5Ref.current = qr

      try {
        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decoded: string) => {
            if (stoppedRef.current || cancelled) return
            stoppedRef.current = true
            try { await qr.stop() } catch { /* ok */ }
            setLoading(true)
            const ok = await onFound(decoded)
            if (!ok) {
              stoppedRef.current = false
              setLoading(false)
              // restart scanner
              try { await qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, async (d: string) => {
                if (stoppedRef.current) return
                stoppedRef.current = true
                try { await qr.stop() } catch { /* ok */ }
                setLoading(true)
                await onFound(d)
                setLoading(false)
              }, () => {}) } catch { /* ok */ }
            }
          },
          () => {}
        )
      } catch {
        onError('No se pudo acceder a la cámara')
      }
    }

    start()

    return () => {
      cancelled = true
      stoppedRef.current = true
      const qr = html5Ref.current as { stop: () => Promise<void> } | null
      qr?.stop().catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-6 w-80 flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <p className="text-gray-900 font-black">Escanear QR del cliente</p>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>
        <p className="text-gray-500 text-sm text-center">Pídele al cliente que abra su app Doggo y muestre su código QR</p>
        <div ref={ref} className="rounded-2xl overflow-hidden border border-gray-200" style={{ width: 256, height: 256 }}>
          <div id="nuevo-pedido-qr" style={{ width: 256, height: 256 }} />
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            Verificando…
          </div>
        )}
        {error && <p className="text-doggo-red text-sm text-center">{error}</p>}
        <button onClick={onClose} className="text-gray-400 text-sm underline">Cancelar</button>
      </div>
    </div>
  )
}
