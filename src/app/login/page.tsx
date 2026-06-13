'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register extra fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/perfil')
        router.refresh()
      } else {
        // Register: create auth user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (signUpError) throw signUpError

        // Create customer record via API (uses admin client, works without a DB trigger)
        if (data.user) {
          await fetch('/api/auth/register-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone: phone || null }),
          })
        }

        router.push('/perfil')
        router.refresh()
      }
    } catch (err: unknown) {
      // Supabase errors are PostgrestError objects, not native Error instances
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Error desconocido'
      // Translate common Supabase errors to Spanish
      if (msg.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos.')
      } else if (msg.includes('User already registered')) {
        setError('Ya existe una cuenta con ese email.')
      } else if (msg.includes('Password should be at least')) {
        setError('La contraseña debe tener al menos 6 caracteres.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-doggo-dark flex flex-col">
      {/* Header */}
      <div className="bg-doggo-dark2 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 text-2xl leading-none">‹</Link>
        <h1 className="text-white text-xl font-black">
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h1>
      </div>

      <div className="flex-1 px-4 py-6">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <span className="text-5xl">🌭</span>
          <p className="text-doggo-yellow font-black text-lg mt-2">Doggo</p>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'login'
              ? 'Accede para ver tus puntos y pedidos'
              : 'Únete y empieza a acumular puntos'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-doggo-dark2 rounded-full p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(null) }}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${
              mode === 'login' ? 'bg-doggo-yellow text-doggo-dark' : 'text-gray-400'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { setMode('register'); setError(null) }}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${
              mode === 'register' ? 'bg-doggo-yellow text-doggo-dark' : 'text-gray-400'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">
                Nombre completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full bg-doggo-dark2 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow placeholder-gray-600"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className="w-full bg-doggo-dark2 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow placeholder-gray-600"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0999 000 000"
                className="w-full bg-doggo-dark2 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow placeholder-gray-600"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">
              Contraseña *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-doggo-dark2 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow placeholder-gray-600"
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-doggo-yellow text-doggo-dark font-black py-4 rounded-full text-base mt-2 disabled:opacity-60 transition-opacity"
          >
            {loading
              ? 'Cargando...'
              : mode === 'login'
              ? 'Entrar'
              : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
