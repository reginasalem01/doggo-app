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
    { label: 'LISTO PARA RETIRAR / ENVIAR', value: 'ready',   cls: 'bg-green-600 hover:bg-green-500' },
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
  deliveryType,
  customerPhone,
  customerName,
  lat,
  lng,
  address,
}: {
  orderId: string
  currentStatus: string
  deliveryType?: string
  customerPhone?: string
  customerName?: string
  lat?: number | null
  lng?: number | null
  address?: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const buttons = BUTTONS[currentStatus] ?? []

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

  if (buttons.length === 0 && !customerPhone) return null

  return (
    <div className="space-y-2.5">
      {/* Botones de contacto */}
      {customerPhone && (
        <div className="grid grid-cols-2 gap-2 mb-1">
          <a
            href={`tel:${customerPhone}`}
            className="flex items-center justify-center gap-2 bg-[#1e1e1e] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#252525] transition-colors"
          >
            📞 Llamar
          </a>
          <a
            href={`https://wa.me/${customerPhone?.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-900/40 text-green-400 font-bold py-3 rounded-xl text-sm hover:bg-green-900/60 transition-colors"
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
          className="flex items-center justify-center gap-2 w-full bg-green-800/40 border border-green-600/40 text-green-400 font-black py-3 rounded-xl text-sm hover:bg-green-800/60 transition-colors"
        >
          🛵 Enviar al motorizado por WhatsApp
        </a>
      )}

      {/* Botones de cambio de estado */}
      {buttons.map((btn) => (
        <button
          key={btn.value}
          onClick={() => changeStatus(btn.value)}
          disabled={loading}
          className={`w-full text-white font-black py-4 rounded-xl text-sm tracking-wide transition-all disabled:opacity-50 ${btn.cls}`}
        >
          {loading ? '…' : btn.label}
        </button>
      ))}
    </div>
  )
}
