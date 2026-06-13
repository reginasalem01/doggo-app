'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  available: boolean
}

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const isEdit = !!product

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [available, setAvailable] = useState(product?.available ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      }),
    })

    if (!res.ok) {
      setError('Error al guardar')
      setLoading(false)
      return
    }

    router.push('/admin/productos')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este producto?')) return
    await fetch(`/api/admin/products/${product!.id}`, { method: 'DELETE' })
    router.push('/admin/productos')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-doggo-dark p-4 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/productos" className="text-gray-400 text-2xl leading-none">‹</Link>
        <h1 className="text-white text-2xl font-black">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">Nombre *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full bg-doggo-dark2 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-doggo-yellow" />
        </div>

        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full bg-doggo-dark2 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-doggo-yellow resize-none" />
        </div>

        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">Precio *</label>
          <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required
            className="w-full bg-doggo-dark2 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-doggo-yellow" />
        </div>

        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">URL de imagen</label>
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-doggo-dark2 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-doggo-yellow placeholder-gray-600" />
        </div>

        <div className="flex items-center justify-between bg-doggo-dark2 rounded-xl px-4 py-3">
          <span className="text-white font-bold">Producto activo</span>
          <button type="button" onClick={() => setAvailable(!available)}
            className={`w-12 h-6 rounded-full transition-colors ${available ? 'bg-doggo-yellow' : 'bg-doggo-dark3'}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${available ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
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
  )
}