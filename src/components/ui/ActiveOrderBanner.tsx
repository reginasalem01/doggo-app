'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type OrderSummary = {
  id: string
  status: string
  total: number
  customer_name: string
  delivery_type: string
  created_at: string
}

const STEPS = [
  { key: 'new',       label: 'Recibido',   icon: '📋' },
  { key: 'preparing', label: 'Preparando', icon: '🍳' },
  { key: 'ready',     label: 'En camino',  icon: '🛵' },
  { key: 'delivered', label: 'Entregado',  icon: '✅' },
]

const STEPS_PICKUP = [
  { key: 'new',       label: 'Recibido',   icon: '📋' },
  { key: 'preparing', label: 'Preparando', icon: '🍳' },
  { key: 'ready',     label: 'Listo',      icon: '🔔' },
  { key: 'delivered', label: 'Entregado',  icon: '✅' },
]

function stepIndex(status: string) {
  if (status === 'new')                      return 0
  if (status === 'accepted')                 return 1
  if (status === 'preparing')                return 1
  if (status === 'ready')                    return 2
  if (status === 'delivered')                return 3
  return 0
}

const TERMINAL = ['delivered', 'cancelled']

export default function ActiveOrderBanner() {
  const [order, setOrder] = useState<OrderSummary | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('lastOrderId')
    if (!id) return

    async function fetchOrder(orderId: string) {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) { localStorage.removeItem('lastOrderId'); return }
      const data: OrderSummary = await res.json()
      setOrder(data)
      if (TERMINAL.includes(data.status)) {
        setTimeout(() => localStorage.removeItem('lastOrderId'), 8000)
      }
    }

    fetchOrder(id)

    const interval = setInterval(async () => {
      const currentId = localStorage.getItem('lastOrderId')
      if (!currentId) { clearInterval(interval); return }
      const res = await fetch(`/api/orders/${currentId}`)
      if (!res.ok) return
      const data: OrderSummary = await res.json()
      setOrder(data)
      if (TERMINAL.includes(data.status)) clearInterval(interval)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (!order) return null
  if (order.status === 'cancelled') return null

  const isDelivery = order.delivery_type === 'delivery'
  const steps = isDelivery ? STEPS : STEPS_PICKUP
  const current = stepIndex(order.status)
  const shortId = order.id.slice(0, 8).toUpperCase()
  const isDelivered = order.status === 'delivered'

  return (
    <div className="px-4 mb-4">
      <Link href={`/pedido/${order.id}`}>
        <div className="bg-doggo-dark2 border border-doggo-yellow/25 rounded-2xl p-4 overflow-hidden relative">

          {/* Subtle glow top edge */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-doggo-yellow/60 to-transparent" />

          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {!isDelivered && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-doggo-yellow opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-doggo-yellow" />
                </span>
              )}
              <p className="text-white font-black text-sm">
                {isDelivered ? '¡Pedido entregado!' : 'Pedido en curso'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">#{shortId}</span>
              <span className="text-doggo-yellow font-black text-sm">${Number(order.total).toFixed(2)}</span>
              <span className="text-doggo-yellow font-black text-base ml-1">›</span>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-start justify-between relative">
            {/* Track background */}
            <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-doggo-dark3 mx-5" />
            {/* Track fill */}
            <div
              className="absolute top-[18px] left-0 h-0.5 bg-doggo-yellow mx-5 transition-all duration-700"
              style={{ right: `${((3 - current) / 3) * 100}%` }}
            />

            {steps.map((step, i) => {
              const done   = i < current
              const active = i === current
              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-500 ${
                    done   ? 'bg-doggo-yellow'                          :
                    active ? 'bg-doggo-yellow ring-4 ring-doggo-yellow/25' :
                             'bg-doggo-dark3'
                  }`}>
                    {step.icon}
                  </div>
                  <p className={`text-[10px] font-bold text-center leading-tight ${
                    active ? 'text-doggo-yellow' : done ? 'text-white' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>

        </div>
      </Link>
    </div>
  )
}
