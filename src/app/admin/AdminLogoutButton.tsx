'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-xl bg-doggo-dark3 hover:text-red-400 transition-colors"
    >
      Salir
    </button>
  )
}
