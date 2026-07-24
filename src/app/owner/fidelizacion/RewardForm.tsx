'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Reward = {
  id?: string
  name: string
  description: string
  points_required: number
  discount_type: 'percentage' | 'fixed' | 'none'
  discount_value: number
  active: boolean
  expires_at: string
}

export default function RewardForm({ reward }: { reward?: Reward }) {
  const router = useRouter()
  const isNew = !reward?.id

  const [form, setForm] = useState<Reward>({
    name: reward?.name ?? '',
    description: reward?.description ?? '',
    points_required: reward?.points_required ?? 100,
    discount_type: (reward as Reward & { discount_type?: Reward['discount_type'] })?.discount_type ?? 'none',
    discount_value: (reward as Reward & { discount_value?: number })?.discount_value ?? 0,
    active: reward?.active ?? true,
    expires_at: reward?.expires_at ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof Reward>(field: K, value: Reward[K]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    if (form.points_required < 1) { setError('Los puntos deben ser mayor a 0'); return }
    setSaving(true)
    setError('')

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      points_required: form.points_required,
      discount_type: form.discount_type === 'none' ? null : form.discount_type,
      discount_value: form.discount_type !== 'none' && form.discount_value > 0 ? form.discount_value : null,
      active: form.active,
      expires_at: form.expires_at || null,
    }

    const res = isNew
      ? await fetch('/api/owner/rewards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch(`/api/owner/rewards/${reward!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    if (!res.ok) { setError('Error al guardar'); setSaving(false); return }
    router.push('/owner/fidelizacion')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este premio?')) return
    setDeleting(true)
    await fetch(`/api/owner/rewards/${reward!.id}`, { method: 'DELETE' })
    router.push('/owner/fidelizacion')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Active toggle */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <span className="text-gray-900 font-semibold text-sm">Activo</span>
        <button
          onClick={() => set('active', !form.active)}
          className={`w-12 h-6 rounded-full transition-colors ${form.active ? 'bg-doggo-yellow' : 'bg-gray-300'}`}
        >
          <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform mx-0.5 ${form.active ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Name */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Nombre *</label>
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Ej: Hot dog gratis"
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
        />
      </div>

      {/* Description */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Detalle del premio..."
          rows={2}
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm resize-none"
        />
      </div>

      {/* Points required */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Puntos necesarios *</label>
        <input
          type="number"
          min={1}
          value={form.points_required}
          onChange={(e) => set('points_required', parseInt(e.target.value) || 0)}
          className="w-full bg-transparent text-gray-900 outline-none text-sm"
        />
        <p className="text-gray-400 text-xs mt-1">1 punto = $1 gastado</p>
      </div>

      {/* Descuento */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <label className="text-gray-500 text-xs uppercase tracking-wide block mb-2">Tipo de descuento</label>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {(['none', 'percentage', 'fixed'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set('discount_type', type)}
              className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                form.discount_type === type ? 'bg-doggo-yellow text-doggo-dark' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {type === 'none' ? 'Sin descuento' : type === 'percentage' ? '% Porcentaje' : '$ Valor fijo'}
            </button>
          ))}
        </div>
        {form.discount_type !== 'none' && (
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">
              {form.discount_type === 'percentage' ? 'Porcentaje (%)' : 'Valor ($)'}
            </label>
            <input
              type="number"
              min={0}
              max={form.discount_type === 'percentage' ? 100 : undefined}
              step={form.discount_type === 'percentage' ? 1 : 0.01}
              value={form.discount_value}
              onChange={(e) => set('discount_value', parseFloat(e.target.value) || 0)}
              placeholder={form.discount_type === 'percentage' ? 'Ej: 10 (10%)' : 'Ej: 2.50'}
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40"
            />
          </div>
        )}
      </div>

      {/* Expires at */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Vence el (opcional)</label>
        <input
          type="date"
          value={form.expires_at}
          onChange={(e) => set('expires_at', e.target.value)}
          className="w-full bg-transparent text-gray-900 outline-none text-sm"
        />
        <p className="text-gray-400 text-xs mt-1">El cliente verá esta fecha en su perfil</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-doggo-yellow text-doggo-dark font-black py-3 rounded-full text-sm disabled:opacity-60"
      >
        {saving ? 'Guardando...' : isNew ? 'Crear premio' : 'Guardar cambios'}
      </button>

      {!isNew && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full bg-red-50 text-red-500 border border-red-200 font-bold py-3 rounded-full text-sm disabled:opacity-60"
        >
          {deleting ? 'Eliminando...' : 'Eliminar premio'}
        </button>
      )}
    </div>
  )
}
