'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/owner',            label: 'Dashboard',     icon: '📊', exact: true },
  { href: '/owner/pedidos',    label: 'Pedidos',        icon: '📋' },
  { href: '/owner/reservas',   label: 'Reservas',       icon: '📅' },
  { href: '/owner/menu',       label: 'Menú',           icon: '🌭' },
  { href: '/owner/promos',     label: 'Promos',         icon: '🎉' },
  { href: '/owner/clientes',   label: 'Clientes',       icon: '👥' },
  { href: '/owner/fidelizacion', label: 'Fidelización', icon: '⭐' },
]

export default function OwnerSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  // Remove mobile max-width constraint for owner panel
  useEffect(() => {
    document.body.classList.add('no-max')
    return () => { document.body.classList.remove('no-max') }
  }, [])

  if (pathname === '/owner/login') return null

  function isActive(item: typeof NAV[0]) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/owner/login')
  }

  return (
    <aside className="w-56 shrink-0 h-screen bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200 flex flex-col items-center gap-1.5">
        <img src="/logo-round.png" alt="Doggo" className="w-16 h-16" />
        <p className="text-gray-400 text-[10px] font-semibold tracking-wide uppercase">Panel del Dueño</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? 'bg-doggo-yellow text-doggo-dark'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-900/10 text-sm font-semibold transition-colors"
        >
          <span>↩</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
