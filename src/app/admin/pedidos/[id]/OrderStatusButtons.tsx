'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Btn = { label: string; value: string; cls: string }

const BUTTONS: Record<string, Btn[]> = {
  new: [
    { label: 'MARCAR EN PREPARACIÓN',    value: 'preparing', cls: 'bg-orange-500 hover:bg-orange-400' },
    { label: 'X  CANCELAR PEDIDO',       value: 'cancelled', cls: 'bg-red-950 hover:bg-red-900 text-red-400' },
  ],
  accepted: [
    { label: 'MARCAR EN PREPARACIÓN',    value: 'preparing', cls: 'bg-orange-500 hover:bg-orange-400' },
    { label: 'X  CANCELAR PEDIDO',       value: 'cancelled', cls: 'bg-red-950 hover:bg-red-900 text-red-400' },
  ],
  preparing: [
    { label: 'LISTO PARA RETIRAR / ENVIAR', value: 'ready',     cls: 'bg-green-600 hover:bg-green-500' },
    { label: 'X  CANCELAR PEDIDO',          value: 'cancelled', cls: 'bg-red-950 hover:bg-red-900 text-red-400' },
  ],
  ready: [
    { label: 'MARCAR COMO ENTREGADO ✓',  value: 'delivered', cls: 'bg-gray-600 hover:bg-gray-500' },
  ],
  delivered: [],
  cancelled: [],
}

export default function OrderStatusButtons({
  orderId,
  currentStatus,
  paymentStatus,
  paymentMethod,
  deliveryType,
  customerPhone,
  customerName,
  lat,
  lng,
  address,
}: {
  orderId: string
  currentStatus: string
  paymentStatus?: string
  paymentMethod?: string
  deliveryType?: string
  customerPhone?: string
  customerName?: string
  lat?: number | null
  lng?: number | null
  address?: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const buttons = BUTTONS[currentStatus] ?? []

  const isPaid = paymentStatus === 'paid'
  const isCash = (paymentMethod ?? 'cash') !== 'card'
  // Only block delivery for cash orders that haven't been paid yet
  // Card orders don't need confirmation — payment was processed online
  const needsPaymentConfirm = currentStatus === 'ready' && isCash && !isPaid

  async function changeStatus(newStatus: string) {
    setLoading(true)
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
    setLoading(false)
  }

  async function confirmPayment() {
    setConfirmingPayment(true)
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'paid' }),
    })
    router.refresh()
    setConfirmingPayment(false)
  }

  if (buttons.length === 0 && !customerPhone) return null

  return (
    <div className="space-y-2.5">
      {/* Botones de contacto */}
      {customerPhone && (
        <div className="grid grid-cols-2 gap-2 mb-1">
          <a
            href={`tel:${customerPhone}`}
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-900 font-bold py-3 rounded-xl text-sm hover:bg-gray-200 transition-colors"
          >
            📞 Llamar
          </a>
          <a
            href={`https://wa.me/${customerPhone?.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-50 text-green-400 font-bold py-3 rounded-xl text-sm hover:bg-green-100 transition-colors"
          >
            💬 WhatsApp
          </a>
        </div>
      )}

      {/* Botón enviar al motorizado (solo domicilio, cuando está listo) */}
      {deliveryType === 'delivery' && currentStatus === 'ready' && (
        <a
          href={(() => {
            const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : null
            const msg = encodeURIComponent(
              `🛵 *Pedido para entregar*\n\n` +
              `👤 Cliente: ${customerName ?? '—'}\n` +
              `📞 Tel: ${customerPhone ?? '—'}\n` +
              (address ? `📍 Dirección: ${address}\n` : '') +
              (mapsLink ? `\n🗺 Ubicación exacta:\n${mapsLink}\n` : '') +
              `\n✅ Cuando entregues, responde: *listo #${orderId.slice(0, 8).toUpperCase()}*`
            )
            return `https://wa.me/?text=${msg}`
          })()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-50 border border-green-200 text-green-600 font-black py-3 rounded-xl text-sm hover:bg-green-100 transition-colors"
        >
          🛵 Enviar al motorizado por WhatsApp
        </a>
      )}

      {/* Confirmar pago (solo cuando el pedido está listo y no se ha cobrado) */}
      {needsPaymentConfirm && (
        <button
          onClick={confirmPayment}
          disabled={confirmingPayment}
          className="w-full bg-doggo-yellow text-doggo-dark font-black py-4 rounded-xl text-sm tracking-wide transition-all disabled:opacity-50"
        >
          {confirmingPayment ? '…' : '💵 CONFIRMAR PAGO RECIBIDO'}
        </button>
      )}

      {/* Botones de cambio de estado */}
      {buttons.map((btn) => {
        // Block "delivered" if payment not confirmed
        const isDeliveryBlocked = btn.value === 'delivered' && needsPaymentConfirm
        return (
          <button
            key={btn.value}
            onClick={() => !isDeliveryBlocked && changeStatus(btn.value)}
            disabled={loading || isDeliveryBlocked}
            title={isDeliveryBlocked ? 'Confirma el pago primero' : undefined}
            className={`w-full text-white font-black py-4 rounded-xl text-sm tracking-wide transition-all disabled:opacity-30 ${btn.cls} ${isDeliveryBlocked ? 'cursor-not-allowed' : ''}`}
          >
            {loading ? '…' : btn.label}
          </button>
        )
      })}
    </div>
  )
}
