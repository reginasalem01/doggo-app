import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function AdminProductosPage() {
  const admin = createAdminClient()
  const { data: products } = await admin
    .from('products')
    .select('*, categories(name)')
    .order('sort_order')

  return (
    <div className="min-h-screen bg-doggo-dark p-4 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 text-2xl leading-none">‹</Link>
          <h1 className="text-white text-2xl font-black">Productos</h1>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="bg-doggo-yellow text-doggo-dark font-black px-4 py-2 rounded-full text-sm"
        >
          + Nuevo
        </Link>
      </div>

      <div className="space-y-3">
        {products?.map((product) => (
          <Link
            key={product.id}
            href={`/admin/productos/${product.id}`}
            className="flex items-center gap-3 bg-doggo-dark2 rounded-2xl p-4"
          >
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{product.name}</p>
              <p className="text-gray-500 text-xs">{(product.categories as { name: string } | null)?.name}</p>
              <p className="text-doggo-yellow font-bold text-sm mt-0.5">${product.price.toFixed(2)}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${product.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {product.available ? 'Activo' : 'Inactivo'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}