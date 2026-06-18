'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { useHydration } from '@/hooks/useHydration'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/',         emoji: '🏠', label: 'Inicio'   },
  { href: '/menu',     emoji: '🌭', label: 'Ordenar'  },
  { href: '/reservas', emoji: '📅', label: 'Reservar' },
  { href: '/perfil',   emoji: '⭐', label: 'Puntos'   },
]

// Rutas del carrito → activan el tab "Ordenar"
const CART_ROUTES = ['/carrito', '/checkout', '/pedido', '/pago']

export default function BottomNav() {
  const pathname = usePathname()
  const hydrated = useHydration()
  const totalItems = useCartStore((s) => s.totalItems())

  // No mostrar en paneles de admin/owner
  if (pathname.startsWith('/admin') || pathname.startsWith('/owner')) return null

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    // Rutas de carrito/checkout activan el tab Ordenar
    if (href === '/menu' && CART_ROUTES.some((r) => pathname.startsWith(r))) return true
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          const isOrdenar = tab.href === '/menu'
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                active ? 'text-doggo-red' : 'text-gray-400'
              )}
            >
              <span className="text-xl relative">
                {tab.emoji}
                {hydrated && isOrdenar && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-doggo-red text-white text-[9px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </span>
              <span className={cn('text-[10px]', active ? 'font-bold' : 'font-normal')}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
