'use client'

import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { useHydration } from '@/hooks/useHydration'

export default function CartIcon() {
  const hydrated = useHydration()
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <Link href="/carrito" className="relative p-1">
      <span className="text-2xl">🛒</span>
      {hydrated && totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-doggo-red text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </Link>
  )
}
