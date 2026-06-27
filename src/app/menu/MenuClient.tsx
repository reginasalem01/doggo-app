'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Category, Product } from '@/types'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import CartIcon from '@/components/ui/CartIcon'

interface Props {
  categories: Category[]
  products: Product[]
}

export default function MenuClient({ categories, products }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { addItem } = useCartStore()

  const filtered = activeCategory
    ? products.filter((p) => p.category_id === activeCategory)
    : products

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-gray-200">
        <h1 className="text-gray-900 text-xl font-black">Menú</h1>
        <CartIcon />
      </div>

      {/* Category filter */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveCategory(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            activeCategory === null
              ? 'bg-doggo-yellow text-doggo-dark'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          Todo
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              activeCategory === cat.id
                ? 'bg-doggo-yellow text-doggo-dark'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="px-4 pb-28 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🌭</p>
            <p className="font-semibold">No hay productos disponibles</p>
          </div>
        )}
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={() => setSelectedProduct(product)}
          />
        ))}
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(notes, qty) => {
            addItem(selectedProduct, qty, notes || undefined)
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}

function ProductCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      className="w-full bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100 text-left active:scale-[0.99] transition-transform"
    >
      {/* Image or emoji placeholder */}
      <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">🌭</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 font-bold text-sm leading-tight">{product.name}</p>
        {product.description && (
          <p className="text-gray-500 text-xs mt-0.5 leading-snug line-clamp-2">
            {product.description}
          </p>
        )}
        <p className="text-doggo-red font-black text-base mt-1">
          {formatPrice(product.price)}
        </p>
      </div>

      <span className="flex-shrink-0 text-gray-300 text-xl">›</span>
    </button>
  )
}

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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Image */}
        {product.image_url ? (
          <div className="w-full h-52 flex-shrink-0 overflow-hidden">
            <Image
              src={product.image_url}
              alt={product.name}
              width={600}
              height={208}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-36 bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-7xl">🌭</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Name + price */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-gray-900 text-xl font-black leading-tight flex-1">{product.name}</h2>
            <p className="text-doggo-red font-black text-xl flex-shrink-0">{formatPrice(product.price)}</p>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Notes */}
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

          {/* Quantity + Add */}
          <div className="flex items-center gap-3 pb-2">
            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 rounded-full bg-white text-gray-900 font-bold text-lg flex items-center justify-center shadow-sm"
              >
                −
              </button>
              <span className="text-gray-900 font-black w-5 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="w-8 h-8 rounded-full bg-white text-gray-900 font-bold text-lg flex items-center justify-center shadow-sm"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={added}
              className={`flex-1 py-3 rounded-full font-black text-sm transition-all ${
                added ? 'bg-green-500 text-white' : 'bg-doggo-yellow text-doggo-dark'
              }`}
            >
              {added ? '✓ Agregado' : `Agregar · ${formatPrice(product.price * qty)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
