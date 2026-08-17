'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DELIVERY_LABELS_STAFF } from '@/lib/utils'

const STATUS: Record<string, { label: string; color: string }> = {
  new:       { label: 'Nuevo',      color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  accepted:  { label: 'Aceptado',   color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  preparing: { label: 'Preparando', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  ready:     { label: 'Listo',      color: 'bg-green-100 text-green-700 border border-green-200' },
  delivered: { label: 'Entregado',  color: 'bg-gray-100 text-gray-600 border border-gray-200' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-100 text-red-600 border border-red-200' },
}

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  delivery_type: string
  total: number
  status: string
  payment_status: string
  payment_method?: string | null
  cash_amount?: number | null
  created_at: string
}

export default function PedidosTable({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase().replace(/^#/, '')

  const filtered = q
    ? orders.filter((o) =>
        o.id.toLowerCase().startsWith(q) ||
        o.id.slice(0, 8).toLowerCase().startsWith(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q)
      )
    : orders

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">🔍</span>
        <input
          type="text"
          placeholder="Buscar por ID, nombre o teléfono…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-doggo-yellow/40"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {!filtered.length ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Sin resultados para <span className="font-semibold text-gray-600">"{query}"</span>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {['ID', 'Cliente', 'Teléfono', 'Tipo', 'Estado', 'Pago', 'Total', 'Fecha'].map((h) => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-6 last:pr-6 last:text-right font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const s = STATUS[o.status] ?? { label: o.status, color: 'bg-gray-100 text-gray-600' }
                  const date = new Date(o.created_at)
                  return (
                    <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                      <td className="px-6 py-3">
                        <Link href={`/owner/pedidos/${o.id}`} className="text-doggo-red font-mono text-xs font-bold hover:underline">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-900 text-sm font-medium">{o.customer_name}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{o.customer_phone}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{DELIVERY_LABELS_STAFF[o.delivery_type] ?? o.delivery_type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-gray-700">
                            {o.payment_method === 'card' ? '💳 Tarjeta' : '💵 Efectivo'}
                          </span>
                          {o.payment_method !== 'card' && o.cash_amount && (
                            <p className="text-gray-400 text-xs">Da ${Number(o.cash_amount).toFixed(2)}</p>
                          )}
                          <p className={`text-xs font-semibold ${o.payment_status === 'paid' ? 'text-green-700' : o.payment_status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {o.payment_status === 'paid' ? '✅ Cobrado' : o.payment_status === 'failed' ? '❌ Fallido' : '⏳ Pendiente'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-bold">${Number(o.total).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-gray-500 text-xs whitespace-nowrap">
                        {date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                        {' '}
                        {date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
