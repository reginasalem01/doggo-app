'use client'

import { useEffect, useRef, useState } from 'react'
import {
  HOTDOG_CATEGORY_NAMES,
  FREE_SALSAS,
  FREE_EXTRAS,
  PAID_TOPPINGS,
} from '@/lib/hotdog-options'

interface Category { id: string; name: string; sort_order: number }
interface Product  { id: string; name: string; price: number; category_id: string | null; image_url: string | null }

interface ItemCustomization {
  salsas: string[]
  extras: string[]
  paidToppings: string[]
  extraPrice: number
  notes: string
}

interface OrderItem {
  cartItemId: string
  product: Product
  qty: number
  customizations?: ItemCustomization
}

interface LinkedCustomer { id: string; name: string; estrellas: number; doggo_cash: number }

interface TicketData {
  orderId: string
  items: OrderItem[]
  subtotal: number
  doggoUsed: number
  total: number
  paymentMethod: 'cash' | 'card'
  customerName: string | null
}

export default function NuevoPedidoClient({
  categories,
  products,
}: {
  categories: Category[]
  products: Product[]
}) {
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [linkedCustomer, setLinkedCustomer] = useState<LinkedCustomer | null>(null)
  const [useDoggoGash, setUseDoggoGash] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Ticket state
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [delivering, setDelivering] = useState(false)
  const [done, setDone] = useState(false)

  // Hotdog customization modal
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null)

  // Hotdog category IDs
  const hotdogCatIds = new Set(
    categories
      .filter((c) => HOTDOG_CATEGORY_NAMES.includes(c.name))
      .map((c) => c.id)
  )

  const filtered = activeCat
    ? products.filter((p) => p.category_id === activeCat)
    : products

  const subtotal = items.reduce((sum, i) => {
    const extra = i.customizations?.extraPrice ?? 0
    return sum + (i.product.price + extra) * i.qty
  }, 0)
  const availableDoggo = Number(linkedCustomer?.doggo_cash ?? 0)
  const doggoToUse = useDoggoGash && availableDoggo > 0
    ? Math.min(availableDoggo, subtotal)
    : 0
  const total = Math.max(0, Math.round((subtotal - doggoToUse) * 100) / 100)
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0)

  function resetForm() {
    setItems([])
    setLinkedCustomer(null)
    setUseDoggoGash(false)
    setPaymentMethod('cash')
    setCreateError(null)
    setTicket(null)
    setDone(false)
  }

  function addItem(product: Product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === product.id)
      if (existing) return prev.map((i) => i.cartItemId === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { cartItemId: product.id, product, qty: 1 }]
    })
  }

  function addCustomizedItem(product: Product, customizations: ItemCustomization) {
    const cartItemId = crypto.randomUUID()
    setItems((prev) => [...prev, { cartItemId, product, qty: 1, customizations }])
  }

  function changeQty(cartItemId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) => i.cartItemId === cartItemId ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    )
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
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.qty,
            customizations: i.customizations
              ? {
                  salsas: i.customizations.salsas,
                  extras: i.customizations.extras,
                  paidToppings: i.customizations.paidToppings,
                  notes: i.customizations.notes,
                }
              : null,
          })),
          linked_customer_id: linkedCustomer?.id ?? null,
          doggo_cash_used: doggoToUse > 0 ? doggoToUse : undefined,
          payment_method: paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')

      const doggoUsed = Number(data.doggo_cash_used ?? 0)
      setTicket({
        orderId: data.id,
        items: [...items],
        subtotal,
        doggoUsed,
        total: Math.max(0, Math.round((subtotal - doggoUsed) * 100) / 100),
        paymentMethod,
        customerName: linkedCustomer?.name ?? null,
      })
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Error al crear pedido')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeliver() {
    if (!ticket) return
    setDelivering(true)
    try {
      const res = await fetch(`/api/admin/orders/${ticket.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setCreateError(data.error ?? 'Error al marcar entregado. Intenta de nuevo.')
        setDelivering(false)
        return
      }
      setDone(true)
      setTimeout(() => resetForm(), 2200)
    } catch {
      setCreateError('Error de red. Intenta de nuevo.')
    } finally {
      setDelivering(false)
    }
  }

  // ── Ticket view (shown after order creation) ──────────────────────────────
  if (ticket) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 w-full max-w-sm overflow-hidden">

          {done ? (
            // Success state — auto-resets after 2.2s
            <div className="p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <p className="text-gray-900 font-black text-xl">¡Pedido completado!</p>
              {ticket.customerName && (
                <p className="text-green-600 text-sm font-semibold">
                  ⭐ Estrellas otorgadas a {ticket.customerName.split(' ')[0]}
                </p>
              )}
              <p className="text-gray-400 text-xs">Listo para el siguiente…</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-doggo-yellow px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-doggo-dark font-black text-lg">Ticket</p>
                  <p className="text-doggo-dark/60 text-xs font-mono">
                    #{ticket.orderId.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-doggo-dark text-sm font-bold">
                    {ticket.paymentMethod === 'card' ? '💳 Tarjeta' : '💵 Efectivo'}
                  </p>
                  {ticket.customerName && (
                    <p className="text-doggo-dark/70 text-xs mt-0.5">
                      {ticket.customerName.split(' ')[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="px-5 py-4 space-y-2.5 border-b border-dashed border-gray-200">
                {ticket.items.map((item) => {
                  const unitPrice = item.product.price + (item.customizations?.extraPrice ?? 0)
                  const c = item.customizations
                  return (
                    <div key={item.cartItemId} className="space-y-0.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.qty}× {item.product.name}</span>
                        <span className="text-gray-900 font-semibold">${(unitPrice * item.qty).toFixed(2)}</span>
                      </div>
                      {c && (c.salsas.length > 0 || c.extras.length > 0 || c.paidToppings.length > 0 || c.notes) && (
                        <div className="pl-4 text-[10px] text-gray-400 space-y-0.5">
                          {c.salsas.length > 0 && <p className="text-green-600">✓ {c.salsas.join(', ')}</p>}
                          {c.extras.length > 0 && <p className="text-green-600">✓ {c.extras.join(', ')}</p>}
                          {c.paidToppings.length > 0 && <p className="text-doggo-red font-semibold">+ {c.paidToppings.join(', ')}</p>}
                          {c.notes && <p className="text-orange-500 italic">✂ {c.notes}</p>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 space-y-2 border-b border-dashed border-gray-200">
                {ticket.doggoUsed > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Subtotal</span>
                      <span>${ticket.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-green-600">
                      <span>⭐ Doggo Cash</span>
                      <span>-${ticket.doggoUsed.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-black text-sm">TOTAL COBRADO</span>
                  <span className="text-doggo-red font-black text-2xl">
                    ${ticket.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Confirm */}
              <div className="px-5 py-4 space-y-2">
                {createError && (
                  <p className="text-doggo-red text-xs text-center font-semibold">{createError}</p>
                )}
                <button
                  onClick={handleDeliver}
                  disabled={delivering}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-base disabled:opacity-50 transition-colors"
                >
                  {delivering ? 'Procesando…' : '✓ ENTREGADO — Confirmar'}
                </button>
                <button
                  onClick={resetForm}
                  className="w-full text-gray-400 text-xs py-1 text-center"
                >
                  Cancelar y volver
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── POS view ──────────────────────────────────────────────────────────────
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
            const isHotdog = product.category_id !== null && hotdogCatIds.has(product.category_id)
            const inCart = items.filter((i) => i.product.id === product.id)
            const totalQtyInCart = inCart.reduce((s, i) => s + i.qty, 0)
            return (
              <button
                key={product.id}
                onClick={() => isHotdog ? setCustomizingProduct(product) : addItem(product)}
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
                  {isHotdog && (
                    <p className="text-gray-400 text-[10px] mt-0.5">Toca para personalizar</p>
                  )}
                </div>
                {totalQtyInCart > 0 && (
                  <div className="bg-doggo-yellow text-doggo-dark text-xs font-black px-2 py-0.5 rounded-full self-start">
                    {totalQtyInCart} en pedido
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
            items.map((item) => {
              const unitPrice = item.product.price + (item.customizations?.extraPrice ?? 0)
              const c = item.customizations
              return (
                <div key={item.cartItemId} className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold text-sm truncate">{item.product.name}</p>
                      {c && (
                        <div className="mt-0.5 space-y-0.5">
                          {c.salsas.length > 0 && (
                            <p className="text-green-600 text-[10px] leading-tight">✓ {c.salsas.join(', ')}</p>
                          )}
                          {c.extras.length > 0 && (
                            <p className="text-green-600 text-[10px] leading-tight">✓ {c.extras.join(', ')}</p>
                          )}
                          {c.paidToppings.length > 0 && (
                            <p className="text-doggo-red text-[10px] leading-tight font-semibold">+ {c.paidToppings.join(', ')}</p>
                          )}
                          {c.notes && (
                            <p className="text-orange-500 text-[10px] leading-tight italic">✂ {c.notes}</p>
                          )}
                        </div>
                      )}
                      <p className="text-gray-400 text-xs mt-0.5">${unitPrice.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => changeQty(item.cartItemId, -1)}
                        className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center"
                      >−</button>
                      <span className="text-gray-900 font-black text-sm w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => changeQty(item.cartItemId, 1)}
                        className="w-7 h-7 rounded-full bg-doggo-yellow text-doggo-dark font-bold text-sm flex items-center justify-center"
                      >+</button>
                    </div>
                    <p className="text-doggo-red font-black text-sm shrink-0 w-14 text-right">
                      ${(unitPrice * item.qty).toFixed(2)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Customer QR link */}
        <div className="px-4 py-3 border-t border-gray-100">
          {linkedCustomer ? (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-black text-green-700 shrink-0">
                  {linkedCustomer.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-bold text-sm truncate">{linkedCustomer.name}</p>
                  <p className="text-green-600 text-xs">
                    {linkedCustomer.estrellas} ⭐
                    {linkedCustomer.doggo_cash > 0 && ` · $${Number(linkedCustomer.doggo_cash).toFixed(2)} Doggo Cash`}
                  </p>
                </div>
                <button
                  onClick={() => { setLinkedCustomer(null); setUseDoggoGash(false) }}
                  className="text-gray-400 text-lg leading-none"
                >×</button>
              </div>

              {/* Doggo Cash toggle */}
              {linkedCustomer.doggo_cash > 0 && (
                <button
                  onClick={() => setUseDoggoGash(!useDoggoGash)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                    useDoggoGash
                      ? 'bg-doggo-yellow/20 border-doggo-yellow text-doggo-dark'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <span>⭐ Usar Doggo Cash</span>
                  <span className={useDoggoGash ? 'text-doggo-dark font-black' : 'text-gray-400'}>
                    {useDoggoGash ? `✓ -$${doggoToUse.toFixed(2)}` : `$${Number(linkedCustomer.doggo_cash).toFixed(2)}`}
                  </span>
                </button>
              )}
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
            <p className="text-gray-400 text-xs mt-1.5 text-center">Opcional — para otorgarle estrellas</p>
          )}
        </div>

        {/* Método de pago */}
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-gray-500 text-xs font-semibold mb-2">MÉTODO DE PAGO</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`py-2.5 rounded-xl text-sm font-black transition-colors ${
                paymentMethod === 'cash'
                  ? 'bg-doggo-dark text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              💵 Efectivo
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`py-2.5 rounded-xl text-sm font-black transition-colors ${
                paymentMethod === 'card'
                  ? 'bg-doggo-dark text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              💳 Tarjeta
            </button>
          </div>
        </div>

        {/* Total + create */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2">
          {doggoToUse > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-gray-400">${subtotal.toFixed(2)}</span>
            </div>
          )}
          {doggoToUse > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-600 font-semibold">⭐ Doggo Cash</span>
              <span className="text-green-600 font-semibold">-${doggoToUse.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-semibold text-sm">Total a cobrar</span>
            <span className="text-doggo-red font-black text-xl">${total.toFixed(2)}</span>
          </div>
          {createError && <p className="text-doggo-red text-xs text-center">{createError}</p>}
          <button
            onClick={handleCreate}
            disabled={creating || items.length === 0}
            className="w-full bg-doggo-yellow text-doggo-dark font-black py-3 rounded-full text-sm disabled:opacity-50 transition-opacity"
          >
            {creating
              ? 'Creando pedido…'
              : linkedCustomer
                ? `Cobrar a ${linkedCustomer.name.split(' ')[0]}`
                : 'Cobrar'
            }
          </button>
          <button
            onClick={resetForm}
            className="w-full text-gray-400 text-xs py-1"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* ── Hotdog customization modal ─────────────────────────── */}
      {customizingProduct && (
        <HotdogCustomizeModal
          product={customizingProduct}
          onAdd={(customizations) => {
            addCustomizedItem(customizingProduct, customizations)
            setCustomizingProduct(null)
          }}
          onClose={() => setCustomizingProduct(null)}
        />
      )}

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
            setLinkedCustomer({
              id: data.customer.id,
              name: data.customer.name,
              estrellas: data.customer.estrellas ?? 0,
              doggo_cash: Number(data.customer.doggo_cash ?? 0),
            })
            setUseDoggoGash(false)
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

// ── Hotdog customization modal ────────────────────────────────────────────────
function HotdogCustomizeModal({
  product,
  onAdd,
  onClose,
}: {
  product: Product
  onAdd: (customizations: ItemCustomization) => void
  onClose: () => void
}) {
  const [salsas, setSalsas] = useState<string[]>([])
  const [extras, setExtras] = useState<string[]>([])
  const [paidToppings, setPaidToppings] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  function toggle<T>(arr: T[], item: T, set: (v: T[]) => void) {
    set(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item])
  }

  const extraPrice = parseFloat((paidToppings.length * 1.25).toFixed(2))
  const totalPrice = product.price + extraPrice

  function handleAdd() {
    onAdd({ salsas, extras, paidToppings, extraPrice, notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <p className="text-gray-900 font-black text-base">{product.name}</p>
            <p className="text-gray-400 text-sm">${product.price.toFixed(2)} base</p>
          </div>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none mt-0.5">×</button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Salsas — GRATIS */}
          <div>
            <p className="text-gray-700 font-black text-sm mb-2">
              Salsas <span className="text-green-600 font-semibold text-xs">GRATIS</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {FREE_SALSAS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggle(salsas, s, setSalsas)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    salsas.includes(s)
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Extras — GRATIS */}
          <div>
            <p className="text-gray-700 font-black text-sm mb-2">
              Extras <span className="text-green-600 font-semibold text-xs">GRATIS</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {FREE_EXTRAS.map((e) => (
                <button
                  key={e}
                  onClick={() => toggle(extras, e, setExtras)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    extras.includes(e)
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Paid toppings */}
          <div>
            <p className="text-gray-700 font-black text-sm mb-2">
              Toppings extra <span className="text-doggo-red font-semibold text-xs">+$1.25 c/u</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {PAID_TOPPINGS.map((t) => (
                <button
                  key={t.name}
                  onClick={() => toggle(paidToppings, t.name, setPaidToppings)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    paidToppings.includes(t.name)
                      ? 'bg-doggo-red text-white border-doggo-red'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notes (remove toppings) */}
          <div>
            <p className="text-gray-700 font-black text-sm mb-2">
              Quitar ingredientes <span className="text-gray-400 font-normal text-xs">(notas para cocina)</span>
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: sin mermelada de piña, sin cebolla…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-doggo-yellow"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleAdd}
            className="w-full bg-doggo-yellow text-doggo-dark font-black py-3.5 rounded-2xl text-sm transition-colors hover:brightness-110"
          >
            Agregar — ${totalPrice.toFixed(2)}
            {extraPrice > 0 && (
              <span className="font-normal opacity-70 ml-1">(+${extraPrice.toFixed(2)} toppings)</span>
            )}
          </button>
        </div>
      </div>
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
              try {
                await qr.start(
                  { facingMode: 'environment' },
                  { fps: 10, qrbox: { width: 220, height: 220 } },
                  async (d: string) => {
                    if (stoppedRef.current) return
                    stoppedRef.current = true
                    try { await qr.stop() } catch { /* ok */ }
                    setLoading(true)
                    await onFound(d)
                    setLoading(false)
                  },
                  () => {}
                )
              } catch { /* ok */ }
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
