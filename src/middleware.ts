import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Proteger /perfil
  if (pathname.startsWith('/perfil') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Proteger /admin (staff) — excluir /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    const { data: profile } = await adminClient
      .from('admin_profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()
    if (!profile) return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Proteger /owner — excluir /owner/login
  if (pathname.startsWith('/owner') && !pathname.startsWith('/owner/login')) {
    if (!user) return NextResponse.redirect(new URL('/owner/login', request.url))
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    const { data: profile } = await adminClient
      .from('admin_profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()
    if (!profile || profile.role !== 'owner') {
      return NextResponse.redirect(new URL('/owner/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/perfil/:path*', '/admin', '/admin/:path*', '/owner', '/owner/:path*'],
}