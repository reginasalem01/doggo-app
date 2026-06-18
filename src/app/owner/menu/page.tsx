import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function OwnerMenuPage() {
  const admin = createAdminClient()

  const { data: categories } = await admin
    .from('categories')
    .select('*, products(*)')
    .order('sort_order')

  const totalProducts = categories?.reduce((s, c) => s + (c.products?.length ?? 0), 0) ?? 0

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 text-2xl font-black">Menú</h1>
          <p className="text-gray-500 text-sm mt-0.5">{totalProducts} productos</p>
        </div>
        <Link
          href="/owner/menu/producto/nuevo"
          className="bg-doggo-yellow text-doggo-dark font-black px-4 py-2 rounded-full text-sm"
        >
          + Nuevo producto
        </Link>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categories?.map((category) => {
          const products = (category.products as { id: string; name: string; price: number; available: boolean }[]) ?? []
          return (
            <div key={category.id} className="bg-gray-50 rounded-2xl overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                <p className="text-gray-900 font-black">{category.name}</p>
                <span className="text-gray-400 text-xs">{products.length} productos</span>
              </div>

              {/* Products */}
              {products.map((product, i) => (
                <Link
                  key={product.id}
                  href={`/owner/menu/producto/${product.id}`}
                  className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-100 transition-colors ${i < products.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">{product.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">${product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                      product.available
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-red-100 text-red-600 border-red-200'
                    }`}>
                      {product.available ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="text-gray-400 text-sm">›</span>
                  </div>
                </Link>
              ))}

              {products.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-6">Sin productos en esta categoría</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
