'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'register' | 'forgot'

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
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login/reset`,
        })
        if (error) throw error
        setError('__success__')
        setLoading(false)
        return
      }

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-4 flex items-center gap-3 border-b border-gray-200">
        <Link href="/" className="text-gray-500 text-2xl leading-none">‹</Link>
        <h1 className="text-gray-900 text-xl font-black">
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h1>
      </div>

      <div className="flex-1 px-4 py-6">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <span className="text-5xl">🌭</span>
          <p className="text-doggo-red font-black text-lg mt-2">Doggo</p>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login' ? 'Accede para ver tus puntos y pedidos'
              : mode === 'register' ? 'Únete y empieza a acumular puntos'
              : 'Te enviamos un link para restablecer tu contraseña'}
          </p>
        </div>

        {/* Forgot password — success state */}
        {mode === 'forgot' && error === '__success__' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-5 text-center mb-6">
            <p className="text-2xl mb-2">📧</p>
            <p className="text-gray-900 font-black text-base">Revisa tu email</p>
            <p className="text-gray-500 text-sm mt-1">Si ese email tiene una cuenta, recibirás un link para restablecer tu contraseña.</p>
            <button onClick={() => { setMode('login'); setError(null) }}
              className="mt-4 text-doggo-red font-bold text-sm">
              ← Volver al login
            </button>
          </div>
        )}

        {/* Mode toggle — solo en login/register */}
        {mode !== 'forgot' && (
          <div className="flex bg-gray-100 rounded-full p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(null) }}
              className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${
                mode === 'login' ? 'bg-doggo-yellow text-doggo-dark' : 'text-gray-500'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setMode('register'); setError(null) }}
              className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${
                mode === 'register' ? 'bg-doggo-yellow text-doggo-dark' : 'text-gray-500'
              }`}
            >
              Registrarse
            </button>
          </div>
        )}

        {/* Form */}
        {!(mode === 'forgot' && error === '__success__') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
                Nombre completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0999 000 000"
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
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
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
              />
            </div>
          )}

          {error && error !== '__success__' && (
            <div className="bg-doggo-red/10 border border-doggo-red/30 rounded-xl px-4 py-3">
              <p className="text-doggo-red text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-doggo-yellow text-doggo-dark font-black py-4 rounded-full text-base mt-2 disabled:opacity-60 transition-opacity"
          >
            {loading ? 'Cargando...'
              : mode === 'login' ? 'Entrar'
              : mode === 'forgot' ? 'Enviar link'
              : 'Crear cuenta'}
          </button>

          {/* Forgot password link */}
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(null) }}
              className="w-full text-center text-gray-400 text-sm py-1"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null) }}
              className="w-full text-center text-gray-400 text-sm py-1"
            >
              ← Volver al login
            </button>
          )}
        </form>
        )}
      </div>
    </div>
  )
}
