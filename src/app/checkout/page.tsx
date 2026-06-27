'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCartStore } from '@/store/cart'
import { formatPrice, DELIVERY_LABELS } from '@/lib/utils'
import type { DeliveryType } from '@/types'

const MapPicker = dynamic(() => import('@/components/ui/MapPicker'), { ssr: false })

const DELIVERY_FEE = 1.5

type CustomerData = {
  customer: { id: string; name: string; points: number }
  rewards: {
    id: string
    name: string
    description: string | null
    points_required: number
    expires_at: string | null
    discount_type: 'percentage' | 'fixed' | 'none' | null
    discount_value: number | null
  }[]
}

type SavedAddress = {
  id: string
  label: string
  address: string
  lat: number | null
  lng: number | null
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const sub = subtotal()

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery')
  const [name, setName]     = useState(() => {
    try { return localStorage.getItem('doggo_checkout_name') ?? '' } catch { return '' }
  })
  const [phone, setPhone]   = useState(() => {
    try { return localStorage.getItem('doggo_customer_phone') ?? '' } catch { return '' }
  })
  const [email, setEmail]   = useState(() => {
    try { return localStorage.getItem('doggo_checkout_email') ?? '' } catch { return '' }
  })
  const [address, setAddress] = useState('')
  const [notes, setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  // Mapa
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  // Direcciones guardadas
  const [savedAddresses, setSavedAddresses]     = useState<SavedAddress[]>([])
  const [saveThisAddress, setSaveThisAddress]   = useState(false)
  const [addressLabel, setAddressLabel]         = useState('Casa')

  // Loyalty
  const [customerData, setCustomerData]       = useState<CustomerData | null>(null)
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/customer/me')
      .then((r) => r.json())
      .then((data) => { if (data?.customer) setCustomerData(data) })
      .catch(() => {})

    fetch('/api/addresses')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSavedAddresses(data) })
      .catch(() => {})
  }, [])

  const deliveryFee = deliveryType === 'delivery' ? DELIVERY_FEE : 0

  const selectedReward = customerData?.rewards.find((r) => r.id === selectedRewardId) ?? null
  const discountAmount = (() => {
    if (!selectedReward) return 0
    if (selectedReward.discount_type === 'percentage' && selectedReward.discount_value) {
      return Math.round((sub * selectedReward.discount_value) / 100 * 100) / 100
    }
    if (selectedReward.discount_type === 'fixed' && selectedReward.discount_value) {
      return Math.min(selectedReward.discount_value, sub)
    }
    return 0
  })()

  const total = Math.max(0, sub + deliveryFee - discountAmount)

  function selectSavedAddress(addr: SavedAddress) {
    setAddress(addr.address)
    if (addr.lat) setLat(addr.lat)
    if (addr.lng) setLng(addr.lng)
  }

  function handleMapChange(newLat: number, newLng: number, geocodedAddress: string) {
    setLat(newLat)
    setLng(newLng)
    if (geocodedAddress && !address) setAddress(geocodedAddress)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-6xl">🛒</span>
        <p className="text-gray-900 font-bold">Tu carrito está vacío</p>
        <Link href="/menu" className="bg-doggo-yellow text-doggo-dark font-bold px-6 py-3 rounded-full">
          Ver menú
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      setError('Nombre y teléfono son obligatorios')
      return
    }
    if (deliveryType === 'delivery' && !address.trim()) {
      setError('Ingresa tu dirección de entrega')
      return
    }

    setLoading(true)
    setError('')

    try {
      const mapsLink = lat && lng
        ? `https://maps.google.com/?q=${lat},${lng}`
        : null

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            customer_email: email.trim() || null,
            delivery_type: deliveryType,
            address: address.trim() || null,
            notes: notes.trim() || null,
            subtotal: sub,
            delivery_fee: deliveryFee,
            total,
            status: 'new',
            payment_status: 'pending',
            lat: lat ?? null,
            lng: lng ?? null,
          },
          items: items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            total: item.product.price * item.quantity,
            notes: item.notes ?? null,
          })),
          reward_id: selectedRewardId ?? undefined,
          customer_id: customerData?.customer.id ?? undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error creando pedido')

      // Guardar dirección si el cliente lo pidió
      if (saveThisAddress && address.trim() && customerData) {
        fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: addressLabel, address: address.trim(), lat, lng }),
        }).catch(() => {})
      }

      clearCart()
      localStorage.setItem('lastOrderId', data.id)
      // Remember for next order
      try {
        localStorage.setItem('doggo_checkout_name', name.trim())
        localStorage.setItem('doggo_customer_phone', phone.trim())
        if (email.trim()) localStorage.setItem('doggo_checkout_email', email.trim())
      } catch {}

      // Email de confirmación (si el cliente ingresó su email)
      if (email.trim()) {
        fetch('/api/email/confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            customerName: name.trim(),
            orderId: data.id,
            items: items.map((i) => ({
              product_name: i.product.name,
              quantity: i.quantity,
              total: i.product.price * i.quantity,
            })),
            total,
            deliveryType,
            address: address.trim() || null,
          }),
        }).catch(() => {}) // fire-and-forget, no bloquear el flujo
      }

      router.push(`/pedido/${data.id}`)
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Hubo un error al crear tu pedido. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-50 px-4 py-4 flex items-center gap-3 border-b border-gray-200">
        <Link href="/carrito" className="text-gray-500 text-2xl leading-none">‹</Link>
        <h1 className="text-gray-900 text-xl font-black">Confirmar pedido</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">

        {/* Tipo de entrega */}
        <div>
          <label className="text-gray-900 text-sm font-bold mb-2 block">¿Cómo quieres recibir tu pedido?</label>
          <div className="grid grid-cols-2 gap-2">
            {(['delivery', 'pickup'] as DeliveryType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDeliveryType(type)}
                className={`py-3 px-2 rounded-xl text-xs font-bold text-center transition-colors ${
                  deliveryType === type ? 'bg-doggo-yellow text-doggo-dark' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {DELIVERY_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Datos de contacto */}
        <div className="space-y-3">
          <label className="text-gray-900 text-sm font-bold block">Tus datos</label>
          <input
            type="text" placeholder="Nombre completo *" value={name}
            onChange={(e) => setName(e.target.value)} required
            className="w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
          />
          <input
            type="tel" placeholder="Teléfono *" value={phone}
            onChange={(e) => setPhone(e.target.value)} required
            className="w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
          />
          <input
            type="email" placeholder="Email (opcional)" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
          />
        </div>

        {/* Sección de domicilio */}
        {deliveryType === 'delivery' && (
          <div className="space-y-3">
            <label className="text-gray-900 text-sm font-bold block">📍 Dirección de entrega</label>

            {/* Direcciones guardadas */}
            {savedAddresses.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-gray-500 text-xs">Tus direcciones guardadas:</p>
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => selectSavedAddress(addr)}
                    className={`w-full text-left rounded-xl px-4 py-2.5 text-sm transition-colors border ${
                      address === addr.address
                        ? 'border-doggo-yellow bg-doggo-yellow/10 text-gray-900'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-semibold text-doggo-red text-xs">{addr.label}</span>
                    <span className="text-gray-400 text-xs"> · </span>
                    <span className="text-xs">{addr.address}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Mapa */}
            <MapPicker lat={lat} lng={lng} onChange={handleMapChange} />

            {/* Campo de dirección (editable, pre-llenado desde mapa) */}
            <input
              type="text"
              placeholder="Calle, número, referencias *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
            />

            {/* Guardar dirección (solo si está logueado) */}
            {customerData && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveThisAddress}
                    onChange={(e) => setSaveThisAddress(e.target.checked)}
                    className="accent-doggo-yellow w-4 h-4"
                  />
                  <span className="text-gray-500 text-sm">Guardar esta dirección para próximas veces</span>
                </label>
                {saveThisAddress && (
                  <div className="grid grid-cols-3 gap-2">
                    {['Casa', 'Trabajo', 'Otro'].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setAddressLabel(label)}
                        className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                          addressLabel === label ? 'bg-doggo-yellow text-doggo-dark' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instrucciones de entrega — solo domicilio */}
        {deliveryType === 'delivery' && (
          <div>
            <label className="text-gray-900 text-sm font-bold block mb-2">Instrucciones de entrega (opcional)</label>
            <textarea
              placeholder="Piso, apartamento, cómo llegar, referencias..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 resize-none"
            />
          </div>
        )}

        {/* Premios de fidelización */}
        {customerData && customerData.rewards.length > 0 && (
          <div>
            <label className="text-gray-900 text-sm font-bold block mb-2">
              🎁 Tienes {customerData.customer.points} pts — canjea un premio
            </label>
            <div className="space-y-2">
              {customerData.rewards.map((r) => {
                const selected = selectedRewardId === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRewardId(selected ? null : r.id)}
                    className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${
                      selected ? 'border-doggo-yellow bg-doggo-yellow/10' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-900 font-semibold text-sm">{r.name}</p>
                        {r.description && <p className="text-gray-500 text-xs mt-0.5">{r.description}</p>}
                      </div>
                      <span className={`text-xs font-black px-2 py-1 rounded-full shrink-0 ml-2 ${selected ? 'bg-doggo-yellow text-doggo-dark' : 'bg-gray-200 text-gray-500'}`}>
                        {r.points_required} pts
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            {selectedRewardId && (
              <p className="text-doggo-red text-xs mt-2 text-center">✅ Premio aplicado</p>
            )}
          </div>
        )}

        {customerData && customerData.rewards.length === 0 && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center border border-gray-200">
            <p className="text-gray-500 text-sm">Tus puntos</p>
            <p className="text-doggo-red font-black">{customerData.customer.points} pts</p>
          </div>
        )}

        {/* Resumen del pedido */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-gray-900 font-bold text-sm mb-3">Resumen</p>
          {items.map((item) => (
            <div key={item.product.id} className="mb-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{item.quantity}× {item.product.name}</span>
                <span className="text-gray-900">{formatPrice(item.product.price * item.quantity)}</span>
              </div>
              {item.notes && (
                <p className="text-gray-400 text-xs italic mt-0.5 pl-3">📝 {item.notes}</p>
              )}
            </div>
          ))}
          <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatPrice(sub)}</span>
            </div>
            {deliveryType === 'delivery' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Envío</span>
                <span className="text-gray-900">{formatPrice(deliveryFee)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">🎁 Descuento</span>
                <span className="text-green-600">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black">
              <span className="text-gray-900">Total</span>
              <span className="text-doggo-red">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-doggo-yellow text-doggo-dark font-black py-4 rounded-full text-base disabled:opacity-60"
        >
          {loading ? 'Enviando pedido…' : `Hacer pedido · ${formatPrice(total)}`}
        </button>

        <p className="text-gray-400 text-xs text-center pb-2">
          Al confirmar, se abrirá WhatsApp para notificar al local.
        </p>
      </form>
    </div>
  )
}
