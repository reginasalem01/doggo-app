'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ui/ImageUpload'

type Promo = {
  id?: string
  title: string
  description: string
  image_url: string
  active: boolean
  starts_at: string
  ends_at: string
}

export default function PromoForm({ promo }: { promo?: Promo }) {
  const router = useRouter()
  const isNew = !promo?.id

  const [form, setForm] = useState<Promo>({
    title: promo?.title ?? '',
    description: promo?.description ?? '',
    image_url: promo?.image_url ?? '',
    active: promo?.active ?? true,
    starts_at: promo?.starts_at ?? '',
    ends_at: promo?.ends_at ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof Promo, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('El título es obligatorio'); return }
    setSaving(true)
    setError('')

    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      active: form.active,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    }

    const res = isNew
      ? await fetch('/api/owner/promos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch(`/api/owner/promos/${promo!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    if (!res.ok) { setError('Error al guardar'); setSaving(false); return }
    router.push('/owner/promos')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta promo?')) return
    setDeleting(true)
    await fetch(`/api/owner/promos/${promo!.id}`, { method: 'DELETE' })
    router.push('/owner/promos')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Active toggle */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <span className="text-gray-900 font-semibold text-sm">Activa</span>
        <button
          onClick={() => set('active', !form.active)}
          className={`w-12 h-6 rounded-full transition-colors ${form.active ? 'bg-doggo-yellow' : 'bg-gray-300'}`}
        >
          <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform mx-0.5 ${form.active ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Title */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Título *</label>
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Ej: 2x1 en hot dogs clásicos"
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
        />
      </div>

      {/* Description */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Detalle de la promoción..."
          rows={3}
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm resize-none"
        />
      </div>

      {/* Image upload */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <ImageUpload
          value={form.image_url}
          onChange={(url) => set('image_url', url)}
          folder="promos"
          label="Foto lateral (opcional)"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
          <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Desde</label>
          <input
            type="date"
            value={form.starts_at}
            onChange={(e) => set('starts_at', e.target.value)}
            className="w-full bg-transparent text-gray-900 outline-none text-sm"
          />
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
          <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Hasta</label>
          <input
            type="date"
            value={form.ends_at}
            onChange={(e) => set('ends_at', e.target.value)}
            className="w-full bg-transparent text-gray-900 outline-none text-sm"
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-doggo-yellow text-doggo-dark font-black py-3 rounded-full text-sm disabled:opacity-60"
      >
        {saving ? 'Guardando...' : isNew ? 'Crear promo' : 'Guardar cambios'}
      </button>

      {!isNew && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full bg-red-50 text-red-500 border border-red-200 font-bold py-3 rounded-full text-sm disabled:opacity-60"
        >
          {deleting ? 'Eliminando...' : 'Eliminar promo'}
        </button>
      )}
    </div>
  )
}
