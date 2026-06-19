'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Crea un usuario staff en Supabase con este email, y el PIN como contraseña.
// Luego agrega ese usuario a admin_profiles con role='staff'.
// Setea NEXT_PUBLIC_STAFF_EMAIL en .env.local
const STAFF_EMAIL = process.env.NEXT_PUBLIC_STAFF_EMAIL ?? 'staff@doggo.ec'

export default function AdminLoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function tryLogin(fullPin: string) {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: STAFF_EMAIL,
      password: fullPin,
    })
    if (error) {
      setError('PIN incorrecto')
      setPin('')
    } else {
      window.location.href = '/admin'
    }
    setLoading(false)
  }

  function press(digit: string) {
    if (loading) return
    const next = pin + digit
    if (next.length > 6) return
    setPin(next)
    setError('')
    // Auto-submit en 4 dígitos (o 6 si el PIN es más largo)
    if (next.length === 4) tryLogin(next)
  }

  function del() {
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="mb-12 text-center">
        <p className="text-doggo-red font-black text-5xl tracking-tight mb-1">🌭 DOGGO</p>
        <p className="text-gray-400 text-xs tracking-[0.3em] uppercase">Panel de Cocina</p>
      </div>

      <p className="text-gray-400 text-xs tracking-[0.2em] uppercase mb-7">
        Ingresa el PIN del restaurante
      </p>

      {/* Puntos del PIN */}
      <div className="flex gap-3.5 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              i < pin.length
                ? 'bg-doggo-yellow scale-110'
                : 'border-2 border-gray-200'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-doggo-red text-sm mb-5 animate-pulse font-semibold">{error}</p>
      )}

      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((k, i) => {
          if (k === '') return <div key={i} />
          if (k === '⌫') return (
            <button
              key={i}
              onClick={del}
              disabled={loading || pin.length === 0}
              className="w-20 h-16 rounded-2xl bg-gray-100 text-gray-500 text-xl hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-30"
            >
              ⌫
            </button>
          )
          return (
            <button
              key={i}
              onClick={() => press(k)}
              disabled={loading}
              className="w-20 h-16 rounded-2xl bg-gray-100 text-gray-900 text-2xl font-bold hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-40"
            >
              {k}
            </button>
          )
        })}
      </div>

      {loading && (
        <p className="text-doggo-red text-sm mt-7 animate-pulse">Verificando…</p>
      )}
    </div>
  )
}
