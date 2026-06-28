'use client'

import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { useHydration } from '@/hooks/useHydration'
import { usePathname } from 'next/navigation'

export default function CartBar() {
  const hydrated = useHydration()
  const pathname = usePathname()
  const modalOpen = useUIStore((s) => s.modalOpen)
  const totalItems = useCartStore((s) => s.totalItems())
  const subtotal = useCartStore((s) => s.subtotal())

  // No mostrar en admin/owner ni en carrito/checkout ni en pedido
  const hide =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/owner') ||
    pathname.startsWith('/carrito') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/pedido') ||
    pathname.startsWith('/pago')

  if (!hydrated || hide || totalItems === 0) return null

  const bottomStyle = modalOpen
    ? { bottom: '16px' }
    : { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 px-4 transition-all duration-300"
      style={bottomStyle}
    >
      <Link href="/carrito">
        <div className="bg-doggo-dark text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <span className="bg-doggo-yellow text-doggo-dark text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
            <span className="font-bold text-sm">Ver carrito</span>
          </div>
          <span className="font-black text-doggo-yellow text-base">
            ${subtotal.toFixed(2)} →
          </span>
        </div>
      </Link>
    </div>
  )
}
