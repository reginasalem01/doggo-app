import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from './admin'

async function getSessionUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Verifica que el request viene de un usuario con admin_profile.
 * role: 'owner' | 'staff' | undefined (any admin role)
 * Retorna NextResponse 401/403 si no pasa, null si está autorizado.
 */
export async function requireRole(role?: 'owner' | 'staff'): Promise<NextResponse | null> {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('admin_profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (role === 'owner' && profile.role !== 'owner') {
    return NextResponse.json({ error: 'Se requiere rol owner' }, { status: 403 })
  }

  return null // autorizado
}
