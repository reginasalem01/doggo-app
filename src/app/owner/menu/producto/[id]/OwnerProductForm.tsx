'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ui/ImageUpload'

type Category = { id: string; name: string }

interface ProductOptionChoice {
  label: string
  extraPrice: number
}

interface ProductOption {
  id: string
  label: string
  required: boolean
  choices: ProductOptionChoice[]
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  available: boolean
  category_id: string | null
  options: ProductOption[]
}

export default function OwnerProductForm({
  product,
  categories,
}: {
  product?: Product
  categories: Category[]
}) {
  const router = useRouter()
  const isEdit = !!product

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [available, setAvailable] = useState(product?.available ?? true)
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  // Normalize: old format stored choices as string[], new format as {label, extraPrice}[]
  function normalizeOptions(raw: ProductOption[]): ProductOption[] {
    return (raw ?? []).map(o => ({
      ...o,
      choices: (o.choices ?? []).map((c: ProductOptionChoice | string) =>
        typeof c === 'string' ? { label: c, extraPrice: 0 } : c
      ),
    }))
  }
  const [options, setOptions] = useState<ProductOption[]>(normalizeOptions(product?.options ?? []))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Option group helpers ────────────────────────────────────────
  function addGroup() {
    setOptions([...options, {
      id: Math.random().toString(36).slice(2),
      label: '',
      required: true,
      choices: [],
    }])
  }

  function updateGroup(id: string, changes: Partial<ProductOption>) {
    setOptions(options.map(o => o.id === id ? { ...o, ...changes } : o))
  }

  function removeGroup(id: string) {
    setOptions(options.filter(o => o.id !== id))
  }

  function addChoice(groupId: string, choice: ProductOptionChoice) {
    const trimmed = choice.label.trim()
    if (!trimmed) return
    setOptions(options.map(o =>
      o.id === groupId && !o.choices.find(c => c.label === trimmed)
        ? { ...o, choices: [...o.choices, { label: trimmed, extraPrice: choice.extraPrice }] }
        : o
    ))
  }

  function removeChoice(groupId: string, label: string) {
    setOptions(options.map(o =>
      o.id === groupId
        ? { ...o, choices: o.choices.filter(c => c.label !== label) }
        : o
    ))
  }

  // ── Submit ──────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const method = isEdit ? 'PATCH' : 'POST'
    const url = isEdit ? `/api/admin/products/${product.id}` : '/api/admin/products'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: description || null,
        price: parseFloat(price),
        image_url: imageUrl || null,
        available,
        category_id: categoryId || null,
        options,
      }),
    })

    if (!res.ok) {
      setError('Error al guardar')
      setLoading(false)
      return
    }

    router.push('/owner/menu')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este producto?')) return
    await fetch(`/api/admin/products/${product!.id}`, { method: 'DELETE' })
    router.push('/owner/menu')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/owner/menu" className="text-gray-500 text-2xl leading-none">‹</Link>
          <h1 className="text-gray-900 text-2xl font-black">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categoría */}
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-doggo-yellow"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-doggo-yellow" />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-doggo-yellow resize-none" />
          </div>

          {/* Precio */}
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wide block mb-1">Precio *</label>
            <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-doggo-yellow" />
          </div>

          {/* Imagen */}
          <div>
            <ImageUpload value={imageUrl} onChange={setImageUrl} folder="products" label="Foto del producto" />
          </div>

          {/* Activo */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-gray-900 font-bold">Producto activo</span>
            <button type="button" onClick={() => setAvailable(!available)}
              className={`w-12 h-6 rounded-full transition-colors relative ${available ? 'bg-doggo-yellow' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${available ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* ── Opciones para el cliente ────────────────────────────── */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
              <div>
                <p className="text-gray-900 font-black text-sm">Opciones para el cliente</p>
                <p className="text-gray-400 text-xs mt-0.5">El cliente elige antes de agregar al carrito</p>
              </div>
              <button
                type="button"
                onClick={addGroup}
                className="bg-doggo-yellow text-doggo-dark font-black text-xs px-3 py-1.5 rounded-full"
              >
                + Agregar grupo
              </button>
            </div>

            {options.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">Sin opciones. Agrega un grupo si el cliente debe elegir algo.</p>
            )}

            <div className="divide-y divide-gray-100">
              {options.map((group, gi) => (
                <OptionGroupEditor
                  key={group.id}
                  group={group}
                  index={gi}
                  onChange={(changes) => updateGroup(group.id, changes)}
                  onRemove={() => removeGroup(group.id)}
                  onAddChoice={(c) => addChoice(group.id, c)}
                  onRemoveChoice={(c) => removeChoice(group.id, c)}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-doggo-yellow text-doggo-dark font-black py-4 rounded-full disabled:opacity-60">
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>

          {isEdit && (
            <button type="button" onClick={handleDelete}
              className="w-full bg-red-500/20 text-red-400 font-bold py-4 rounded-full">
              Eliminar producto
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Option group editor ───────────────────────────────────────────────────────

function OptionGroupEditor({
  group,
  index,
  onChange,
  onRemove,
  onAddChoice,
  onRemoveChoice,
}: {
  group: ProductOption
  index: number
  onChange: (changes: Partial<ProductOption>) => void
  onRemove: () => void
  onAddChoice: (choice: ProductOptionChoice) => void
  onRemoveChoice: (label: string) => void
}) {
  const [newLabel, setNewLabel] = useState('')
  const [newPrice, setNewPrice] = useState('0')

  function handleAddChoice() {
    if (!newLabel.trim()) return
    onAddChoice({ label: newLabel.trim(), extraPrice: parseFloat(newPrice) || 0 })
    setNewLabel('')
    setNewPrice('0')
  }

  return (
    <div className="p-4 space-y-3">
      {/* Group label */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs font-bold w-5">#{index + 1}</span>
        <input
          type="text"
          value={group.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Pregunta · ej: ¿Qué cola quieres?"
          className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow"
        />
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">×</button>
      </div>

      {/* Required toggle */}
      <div className="flex items-center gap-2 pl-7">
        <button
          type="button"
          onClick={() => onChange({ required: !group.required })}
          className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${group.required ? 'bg-doggo-red' : 'bg-gray-300'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-0.5 ${group.required ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <span className="text-xs text-gray-500">{group.required ? 'Obligatorio' : 'Opcional'}</span>
      </div>

      {/* Existing choices */}
      <div className="pl-7 space-y-2">
        {group.choices.length === 0 && (
          <p className="text-gray-400 text-xs italic">Sin opciones aún</p>
        )}
        <div className="space-y-1">
          {group.choices.map((c) => (
            <div key={c.label} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span className="flex-1 text-gray-800 text-xs font-semibold">{c.label}</span>
              <span className={`text-xs font-bold ${c.extraPrice > 0 ? 'text-doggo-red' : 'text-gray-400'}`}>
                {c.extraPrice > 0 ? `+$${c.extraPrice.toFixed(2)}` : 'Gratis'}
              </span>
              <button type="button" onClick={() => onRemoveChoice(c.label)} className="text-gray-400 hover:text-red-500 text-sm leading-none">×</button>
            </div>
          ))}
        </div>

        {/* Add new choice */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChoice() } }}
            placeholder="Nueva opción"
            className="flex-1 bg-white border border-gray-200 text-gray-900 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-doggo-yellow"
          />
          <div className="relative w-24">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">+$</span>
            <input
              type="number"
              min="0"
              step="0.25"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl pl-7 pr-2 py-2 text-xs outline-none focus:ring-2 focus:ring-doggo-yellow"
            />
          </div>
          <button
            type="button"
            onClick={handleAddChoice}
            className="bg-gray-100 text-gray-600 font-bold text-xs px-3 py-2 rounded-xl hover:bg-gray-200 whitespace-nowrap"
          >
            + Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
