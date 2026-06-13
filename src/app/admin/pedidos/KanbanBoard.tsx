'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type OrderItem = { product_name: string; quantity: number }

export type Order = {
  id: string
  created_at: string
  customer_name: string
  customer_phone: string
  delivery_type: string
  total: number
  status: string
  notes?: string | null
  order_items: OrderItem[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return 'Ahora'
  if (mins === 1) return '1 min'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h`
}

const ACTION: Record<string, { label: string; next: string; cls: string }> = {
  new:       { label: '+ ACEPTAR',  next: 'preparing', cls: 'bg-doggo-yellow text-doggo-dark hover:brightness-110' },
  accepted:  { label: '✓ LISTO',    next: 'ready',     cls: 'bg-green-600 text-white hover:bg-green-500' },
  preparing: { label: '✓ LISTO',    next: 'ready',     cls: 'bg-green-600 text-white hover:bg-green-500' },
  ready:     { label: 'ENTREGADO ✓', next: 'delivered', cls: 'bg-gray-600 text-white hover:bg-gray-500' },
}

// ── Order card ─────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const action = ACTION[order.status]
  const shortId = '#' + order.id.slice(0, 4).toUpperCase()
  const nameParts = order.customer_name.trim().split(' ')
  const displayName = nameParts[0] + (nameParts[1] ? ' ' + nameParts[1][0] + '.' : '')
  const items = order.order_items.map((i) => `${i.product_name} x${i.quantity}`).join(', ')

  async function advance(e: React.MouseEvent) {
    e.preventDefault()           // evita que el Link navegue
    if (!action || busy) return
    setBusy(true)
    await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action.next }),
    })
    router.refresh()
    setBusy(false)
  }

  return (
    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-[#2a2a2a] mb-2 last:mb-0">
      {/* Card body — toca para ir al detalle */}
      <Link href={`/admin/pedidos/${order.id}`} className="block p-3 active:bg-[#252525] transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-gray-500 text-xs font-medium">{timeAgo(order.created_at)}</span>
          <span className="text-doggo-yellow font-mono text-xs font-black">{shortId}</span>
        </div>

        <p className="text-white font-bold text-sm mb-0.5">{displayName}</p>

        {items && (
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-1">{items}</p>
        )}

        {order.notes && (
          <p className="text-orange-300 text-xs truncate mb-1">📝 {order.notes}</p>
        )}

        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-500 text-xs">
            {order.delivery_type === 'delivery' ? '🛵 Domicilio' : order.delivery_type === 'pickup' ? '🏃 Retiro' : '🪑 Local'}
          </span>
          <span className="text-doggo-yellow font-black text-base">${Number(order.total).toFixed(2)}</span>
        </div>
      </Link>

      {/* Botón de acción rápida */}
      {action && (
        <button
          onClick={advance}
          disabled={busy}
          className={`w-full py-2.5 text-xs font-black tracking-wider transition-all ${action.cls} disabled:opacity-40`}
        >
          {busy ? '…' : action.label}
        </button>
      )}
    </div>
  )
}

// ── Columna ────────────────────────────────────────────────────────────────────

type ColDef = {
  id: string
  title: string
  headerCls: string
  orders: Order[]
}

function KanbanColumn({ col }: { col: ColDef }) {
  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-[#161616] rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 shrink-0 ${col.headerCls}`}>
        <p className="font-black text-sm tracking-widest text-white">{col.title}</p>
        <span className="bg-black/40 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
          {col.orders.length}
        </span>
      </div>

      {/* Lista scrollable */}
      <div className="flex-1 overflow-y-auto p-2">
        {col.orders.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-10">Vacío</p>
        ) : (
          col.orders.map((o) => <OrderCard key={o.id} order={o} />)
        )}
      </div>
    </div>
  )
}

// ── Board principal ─────────────────────────────────────────────────────────────

export default function KanbanBoard({ orders }: { orders: Order[] }) {
  const cols: ColDef[] = [
    {
      id: 'new',
      title: 'NUEVOS',
      headerCls: 'bg-red-900/60',
      orders: orders.filter((o) => o.status === 'new'),
    },
    {
      id: 'preparing',
      title: 'PREPARANDO',
      headerCls: 'bg-orange-900/60',
      orders: orders.filter((o) => ['accepted', 'preparing'].includes(o.status)),
    },
    {
      id: 'ready',
      title: 'LISTOS',
      headerCls: 'bg-green-900/60',
      orders: orders.filter((o) => o.status === 'ready'),
    },
  ]

  return (
    <div className="flex gap-2.5 h-full p-3">
      {cols.map((col) => (
        <KanbanColumn key={col.id} col={col} />
      ))}
    </div>
  )
}
