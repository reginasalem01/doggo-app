'use client'

import { useState } from 'react'
import Link from 'next/link'

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  estrellas: number | null
  doggo_cash: number | null
  created_at: string
}

export default function ClientesTable({
  customers,
  spendPerHotDog,
  milestoneCount,
}: {
  customers: Customer[]
  spendPerHotDog: number
  milestoneCount: number
}) {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()

  const filtered = q
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q)
      )
    : customers

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono…"
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
        <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Cliente', 'Email', 'Teléfono', 'Gastado aprox.', 'Ciclo actual', 'Doggo Cash', 'Desde'].map((h) => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-4 py-3 first:pl-6 last:pr-6 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const initials      = c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                  const estrellas     = c.estrellas ?? 0
                  const doggoCash     = Number(c.doggo_cash ?? 0)
                  const cycleProgress = estrellas % milestoneCount
                  const cyclesTotal   = Math.floor(estrellas / milestoneCount)
                  const totalSpent    = estrellas * spendPerHotDog

                  return (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">

                      <td className="px-6 py-3">
                        <Link href={`/owner/clientes/${c.id}`} className="flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-doggo-red/10 flex items-center justify-center shrink-0">
                            <span className="text-doggo-red font-black text-xs">{initials}</span>
                          </div>
                          <span className="text-gray-900 font-semibold text-sm group-hover:text-doggo-red transition-colors">
                            {c.name}
                          </span>
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-gray-500 text-sm">{c.email ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{c.phone ?? '—'}</td>

                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 font-bold text-sm">${totalSpent.toFixed(0)}</p>
                          <p className="text-gray-400 text-[10px]">{estrellas} 🌭 total</p>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {Array.from({ length: milestoneCount }).map((_, i) => (
                              <span key={i} className="text-xs" style={{ opacity: i < cycleProgress ? 1 : 0.2 }}>🌭</span>
                            ))}
                          </div>
                          <span className="text-gray-500 text-xs">{cycleProgress}/{milestoneCount}</span>
                        </div>
                        {cyclesTotal > 0 && (
                          <p className="text-gray-400 text-[10px] mt-0.5">{cyclesTotal} {cyclesTotal === 1 ? 'ciclo' : 'ciclos'} completados</p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`font-black text-sm ${doggoCash > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          ${doggoCash.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
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
