'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/types'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

// Reusa el mismo modal de MenuClient pero inline aquí
function ProductModal({
  product,
  onClose,
  onAdd,
}: {
  product: Product
  onClose: () => void
  onAdd: (notes: string, qty: number) => void
}) {
  const [notes, setNotes] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    onAdd(notes, qty)
    setAdded(true)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {product.image_url ? (
          <div className="w-full h-52 flex-shrink-0 overflow-hidden">
            <Image src={product.image_url} alt={product.name} width={600} height={208} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-36 bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-7xl">🌭</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-gray-900 text-xl font-black leading-tight flex-1">{product.name}</h2>
            <p className="text-doggo-red font-black text-xl flex-shrink-0">{formatPrice(product.price)}</p>
          </div>
          {product.description && (
            <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
          )}
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wide">
              Personalización (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sin cebolla, extra queso, término medio..."
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 resize-none"
            />
          </div>
        </div>

        <div className="px-5 pb-8 pt-3 border-t border-gray-100 flex items-center gap-3 bg-white">
          <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
            <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-8 h-8 rounded-full bg-white text-gray-900 font-bold text-lg flex items-center justify-center shadow-sm">−</button>
            <span className="text-gray-900 font-black w-5 text-center">{qty}</span>
            <button type="button" onClick={() => setQty(qty + 1)}
              className="w-8 h-8 rounded-full bg-white text-gray-900 font-bold text-lg flex items-center justify-center shadow-sm">+</button>
          </div>
          <button onClick={handleAdd} disabled={added}
            className={`flex-1 py-3 rounded-full font-black text-sm transition-all ${added ? 'bg-green-500 text-white' : 'bg-doggo-yellow text-doggo-dark'}`}>
            {added ? '✓ Agregado' : `Agregar · ${formatPrice(product.price * qty)}`}
          </button>
        </div>
      </div>
    </>
  )
}

export default function FeaturedProducts({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Product | null>(null)
  const { addItem } = useCartStore()

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => setSelected(product)}
            className="shrink-0 w-36 bg-gray-50 rounded-2xl overflow-hidden text-left active:scale-95 transition-transform"
          >
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-28 object-cover" />
            ) : (
              <div className="w-full h-28 bg-gray-100 flex items-center justify-center">
                <span className="text-4xl">🌭</span>
              </div>
            )}
            <div className="p-2.5">
              <p className="text-gray-900 font-bold text-xs leading-tight line-clamp-2 mb-1">{product.name}</p>
              <p className="text-doggo-red font-black text-sm mb-2">${Number(product.price).toFixed(2)}</p>
              <div className="w-full bg-doggo-yellow text-doggo-dark text-[10px] font-black py-1 rounded-lg text-center">
                + Añadir
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onAdd={(notes, qty) => {
            addItem(selected, qty, notes || undefined)
            setSelected(null)
          }}
        />
      )}
    </>
  )
}
