'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ConfiguracionPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')

      const res = await fetch('/api/customer/me')
      const data = await res.json()
      if (data?.customer) {
        setName(data.customer.name ?? '')
        setPhone(data.customer.phone ?? '')
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    const res = await fetch('/api/customer/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
    })
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError('No se pudo guardar. Intenta de nuevo.')
    }
    setSaving(false)
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword) { setPasswordError('Ingresa tu contraseña actual'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Las contraseñas no coinciden'); return }
    if (newPassword.length < 6) { setPasswordError('Mínimo 6 caracteres'); return }
    setSavingPassword(true)
    setPasswordError(null)
    const supabase = createClient()
    // Verificar contraseña actual re-autenticando
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (authError) {
      setPasswordError('Contraseña actual incorrecta')
      setSavingPassword(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
    setSavingPassword(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-doggo-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3 border-b border-gray-100">
        <Link href="/perfil" className="text-gray-500 text-2xl leading-none">‹</Link>
        <h1 className="text-gray-900 text-xl font-black">Configuración</h1>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Datos personales */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
          <p className="text-gray-900 font-black text-base mb-4">Mis datos</p>
          <form onSubmit={saveProfile} className="space-y-3">
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0999 000 000"
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-gray-100 border border-gray-200 text-gray-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
              />
              <p className="text-gray-400 text-xs mt-1">El email no se puede cambiar</p>
            </div>
            {error && <p className="text-doggo-red text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm font-semibold">✅ Datos guardados</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-doggo-yellow text-doggo-dark font-black py-3 rounded-xl text-sm disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
          <p className="text-gray-900 font-black text-base mb-4">Cambiar contraseña</p>
          <form onSubmit={savePassword} className="space-y-3">
            <input
              type="password"
              placeholder="Contraseña actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
            />
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required minLength={6}
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required minLength={6}
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 placeholder-gray-400"
            />
            {passwordError && <p className="text-doggo-red text-sm">{passwordError}</p>}
            {passwordSuccess && <p className="text-green-600 text-sm font-semibold">✅ Contraseña actualizada</p>}
            <button
              type="submit"
              disabled={savingPassword}
              className="w-full bg-gray-900 text-white font-black py-3 rounded-xl text-sm disabled:opacity-60"
            >
              {savingPassword ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>

        {/* Links útiles */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
          <Link href="/perfil" className="flex items-center justify-between px-5 py-4 border-b border-gray-200 active:bg-gray-100">
            <span className="text-gray-900 text-sm font-semibold">⭐ Mis puntos</span>
            <span className="text-gray-400 text-lg">›</span>
          </Link>
          <Link href="/reservas" className="flex items-center justify-between px-5 py-4 border-b border-gray-200 active:bg-gray-100">
            <span className="text-gray-900 text-sm font-semibold">📅 Mis reservas</span>
            <span className="text-gray-400 text-lg">›</span>
          </Link>
          <Link href="/menu" className="flex items-center justify-between px-5 py-4 active:bg-gray-100">
            <span className="text-gray-900 text-sm font-semibold">🌭 Ver menú</span>
            <span className="text-gray-400 text-lg">›</span>
          </Link>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 border border-red-100 text-doggo-red font-black py-4 rounded-2xl text-sm"
        >
          Cerrar sesión
        </button>

      </div>
    </div>
  )
}
