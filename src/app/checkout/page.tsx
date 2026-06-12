'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { formatPrice, buildWhatsAppLink, DELIVERY_LABELS } from '@/lib/utils'
import type { DeliveryType } from '@/types'
import { createClient } from '@/lib/supabase/client'

const DELIVERY_FEE = 1.5

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const sub = subtotal()

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const deliveryFee = deliveryType === 'delivery' ? DELIVERY_FEE : 0
  const total = sub + deliveryFee

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-doggo-dark flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-6xl">🛒</span>
        <p className="text-white font-bold">Tu carrito está vacío</p>
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
      const supabase = createClient()

      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
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
        })
        .select('id')
        .single()

      if (orderError || !order) throw orderError ?? new Error('Error creando pedido')

      // 2. Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        total: item.product.price * item.quantity,
        notes: item.notes ?? null,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 3. Clear cart
      clearCart()

      // 4. Build WhatsApp message and open
      const itemsList = items
        .map((i) => `• ${i.quantity}x ${i.product.name} — ${formatPrice(i.product.price * i.quantity)}`)
        .join('\n')

      const shortId = order.id.slice(0, 8).toUpperCase()
      const whatsappMsg =
        `🌭 *Nuevo pedido #${shortId}*\n\n` +
        `*Cliente:* ${name}\n` +
        `*Tel:* ${phone}\n` +
        `*Tipo:* ${DELIVERY_LABELS[deliveryType]}\n` +
        (address ? `*Dirección:* ${address}\n` : '') +
        (notes ? `*Notas:* ${notes}\n` : '') +
        `\n*Productos:*\n${itemsList}\n\n` +
        `*Total: ${formatPrice(total)}*`

      const waUrl = buildWhatsAppLink(whatsappMsg)

      // 5. Redirect to confirmation, open WhatsApp
      router.push(`/pedido/${order.id}`)
      window.open(waUrl, '_blank')
    } catch (err) {
      console.error(err)
      setError('Hubo un error al crear tu pedido. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-doggo-dark">
      {/* Header */}
      <div className="bg-doggo-dark2 px-4 py-4 flex items-center gap-3">
        <Link href="/carrito" className="text-gray-400 text-2xl leading-none">‹</Link>
        <h1 className="text-white text-xl font-black">Confirmar pedido</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Delivery type */}
        <div>
          <label className="text-white text-sm font-bold mb-2 block">¿Cómo quieres recibir tu pedido?</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(DELIVERY_LABELS) as DeliveryType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDeliveryType(type)}
                className={`py-3 px-2 rounded-xl text-xs font-bold text-center transition-colors ${
                  deliveryType === type
                    ? 'bg-doggo-yellow text-doggo-dark'
                    : 'bg-doggo-dark2 text-gray-400'
                }`}
              >
                {DELIVERY_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-3">
          <label className="text-white text-sm font-bold block">Tus datos</label>

          <input
            type="text"
            placeholder="Nombre completo *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-doggo-dark2 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow"
          />
          <input
            type="tel"
            placeholder="Teléfono *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full bg-doggo-dark2 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow"
          />
          <input
            type="email"
            placeholder="Email (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-doggo-dark2 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow"
          />
        </div>

        {/* Address (only for delivery) */}
        {deliveryType === 'delivery' && (
          <div>
            <label className="text-white text-sm font-bold block mb-2">Dirección de entrega</label>
            <input
              type="text"
              placeholder="Calle, número, referencias *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full bg-doggo-dark2 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-white text-sm font-bold block mb-2">Notas (opcional)</label>
          <textarea
            placeholder="Sin cebolla, picante extra, sin mostaza..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-doggo-dark2 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow resize-none"
          />
        </div>

        {/* Order summary */}
        <div className="bg-doggo-dark2 rounded-2xl p-4">
          <p className="text-white font-bold text-sm mb-3">Resumen</p>
          {items.map((item) => (
            <div key={item.product.id} className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{item.quantity}× {item.product.name}</span>
              <span className="text-white">{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-doggo-dark3 mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">{formatPrice(sub)}</span>
            </div>
            {deliveryType === 'delivery' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Envío</span>
                <span className="text-white">{formatPrice(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-black">
              <span className="text-white">Total</span>
              <span className="text-doggo-yellow">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-doggo-yellow text-doggo-dark font-black py-4 rounded-full text-base disabled:opacity-60"
        >
          {loading ? 'Enviando pedido...' : `Hacer pedido · ${formatPrice(total)}`}
        </button>

        <p className="text-gray-500 text-xs text-center pb-2">
          Al confirmar, se abrirá WhatsApp para notificar al local.
        </p>
      </form>
    </div>
  )
}
