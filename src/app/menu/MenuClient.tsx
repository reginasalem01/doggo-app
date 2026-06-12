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
  const { addItem } = useCartStore()

  const filtered = activeCategory
    ? products.filter((p) => p.category_id === activeCategory)
    : products

  return (
    <div className="min-h-screen bg-doggo-dark">
      {/* Header */}
      <div className="bg-doggo-dark2 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-white text-xl font-black">Menú</h1>
        <CartIcon />
      </div>

      {/* Category filter */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveCategory(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            activeCategory === null
              ? 'bg-doggo-yellow text-doggo-dark'
              : 'bg-doggo-dark2 text-gray-400'
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
                : 'bg-doggo-dark2 text-gray-400'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="px-4 pb-4 space-y-3">
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
            onAdd={() => addItem(product, 1)}
          />
        ))}
      </div>
    </div>
  )
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product
  onAdd: () => void
}) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    onAdd()
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div className="bg-doggo-dark2 rounded-xl p-4 flex items-center gap-4">
      {/* Image or emoji placeholder */}
      <div className="w-20 h-20 rounded-xl bg-doggo-dark3 flex items-center justify-center flex-shrink-0 overflow-hidden">
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
        <p className="text-white font-bold text-sm leading-tight">{product.name}</p>
        {product.description && (
          <p className="text-gray-400 text-xs mt-0.5 leading-snug line-clamp-2">
            {product.description}
          </p>
        )}
        <p className="text-doggo-yellow font-black text-base mt-1">
          {formatPrice(product.price)}
        </p>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-bold transition-all ${
          added
            ? 'bg-green-600 text-white scale-95'
            : 'bg-doggo-yellow text-doggo-dark'
        }`}
      >
        {added ? '✓' : '+ Añadir'}
      </button>
    </div>
  )
}
