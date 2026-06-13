'use client'

import { useCartStore } from '@/store/cart'
import type { Product } from '@/types'

export default function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <button
      onClick={() => addItem(product, 1)}
      className="w-full bg-doggo-yellow text-doggo-dark text-[10px] font-black py-1 rounded-lg active:scale-95 transition-transform"
    >
      + Añadir
    </button>
  )
}
