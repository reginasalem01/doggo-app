'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const NAV = [
  { href: '/admin',          label: 'Cola de Pedidos', icon: '📋', exact: true },
  { href: '/admin/reservas', label: 'Reservas',        icon: '📅' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    document.body.classList.add('no-max')
    return () => { document.body.classList.remove('no-max') }
  }, [])

  // Login page: sin header, sin layout extra
  if (pathname === '/admin/login') return <>{children}</>

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="flex flex-col h-screen bg-[#111] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-[#1a1a1a] border-b border-[#2a2a2a] shrink-0">
        <p className="text-doggo-yellow font-black text-xl tracking-tight">🌭 DOGGO</p>

        <nav className="flex items-center gap-2">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-full transition-colors ${
                  active
                    ? 'bg-doggo-yellow text-doggo-dark'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={logout}
          className="text-gray-500 hover:text-red-400 text-sm font-semibold transition-colors"
        >
          Salir ↩
        </button>
      </header>

      {/* Contenido — cada página maneja su propio scroll */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
