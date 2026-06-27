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
  if (status === 'new')       return 0
  if (status === 'accepted')  return 1
  if (status === 'preparing') return 1
  if (status === 'ready')     return 2
  if (status === 'delivered') return 3
  return 0
}

const TERMINAL = ['delivered', 'cancelled']

function getStoredIds(): string[] {
  try {
    const raw = localStorage.getItem('doggo_active_orders')
    if (raw) return JSON.parse(raw) as string[]
    // Migrate old single key
    const old = localStorage.getItem('lastOrderId')
    if (old) { localStorage.removeItem('lastOrderId'); return [old] }
  } catch {}
  return []
}

function saveIds(ids: string[]) {
  try { localStorage.setItem('doggo_active_orders', JSON.stringify(ids)) } catch {}
}

export default function ActiveOrderBanner() {
  const [orders, setOrders] = useState<OrderSummary[]>([])

  useEffect(() => {
    const ids = getStoredIds()
    if (ids.length === 0) return

    async function fetchAll(currentIds: string[]) {
      const results = await Promise.all(
        currentIds.map(async (id) => {
          try {
            const res = await fetch(`/api/orders/${id}`)
            if (!res.ok) return null
            return (await res.json()) as OrderSummary
          } catch { return null }
        })
      )
      const valid = results.filter(Boolean) as OrderSummary[]
      setOrders(valid.filter((o) => o.status !== 'cancelled'))

      // Clean up terminal orders after 8s
      const terminal = valid.filter((o) => TERMINAL.includes(o.status))
      if (terminal.length > 0) {
        setTimeout(() => {
          const remaining = getStoredIds().filter(
            (id) => !terminal.map((o) => o.id).includes(id)
          )
          saveIds(remaining)
          setOrders((prev) => prev.filter((o) => !TERMINAL.includes(o.status)))
        }, 8000)
      }
    }

    fetchAll(ids)

    const interval = setInterval(() => {
      const currentIds = getStoredIds()
      if (currentIds.length === 0) { clearInterval(interval); return }
      fetchAll(currentIds)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (orders.length === 0) return null

  return (
    <div className="px-4 mb-4 space-y-3">
      {orders.map((order) => {
        const isDelivery = order.delivery_type === 'delivery'
        const steps = isDelivery ? STEPS : STEPS_PICKUP
        const current = stepIndex(order.status)
        const shortId = order.id.slice(0, 8).toUpperCase()
        const isDelivered = order.status === 'delivered'

        return (
          <Link key={order.id} href={`/pedido/${order.id}`}>
            <div className="bg-gray-50 border border-doggo-yellow/30 rounded-2xl p-4 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-doggo-yellow/60 to-transparent" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {!isDelivered && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-doggo-yellow opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-doggo-yellow" />
                    </span>
                  )}
                  <p className="text-gray-900 font-black text-sm">
                    {isDelivered ? '¡Pedido entregado!' : 'Pedido en curso'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">#{shortId}</span>
                  <span className="text-doggo-red font-black text-sm">${Number(order.total).toFixed(2)}</span>
                  <span className="text-doggo-red font-black text-base ml-1">›</span>
                </div>
              </div>

              <div className="flex items-start justify-between relative">
                <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-gray-200 mx-5" />
                <div
                  className="absolute top-[18px] left-0 h-0.5 bg-doggo-red mx-5 transition-all duration-700"
                  style={{ right: `${((3 - current) / 3) * 100}%` }}
                />
                {steps.map((step, i) => {
                  const done   = i < current
                  const active = i === current
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-500 ${
                        done   ? 'bg-doggo-red' :
                        active ? 'bg-doggo-yellow ring-4 ring-doggo-yellow/40' :
                                 'bg-gray-100'
                      }`}>
                        {step.icon}
                      </div>
                      <p className={`text-[10px] font-bold text-center leading-tight ${
                        active ? 'text-doggo-red' : done ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
