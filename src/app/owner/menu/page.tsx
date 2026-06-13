import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function OwnerMenuPage() {
  const admin = createAdminClient()

  const { data: categories } = await admin
    .from('categories')
    .select('*, products(*)')
    .order('sort_order')

  return (
    <div className="p-8">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-black">Menú</h1>
          </div>
          <Link
            href="/owner/menu/producto/nuevo"
            className="bg-doggo-yellow text-doggo-dark font-black px-4 py-2 rounded-full text-sm"
          >
            + Nuevo producto
          </Link>
        </div>

        <div className="space-y-6">
          {categories?.map((category) => (
            <div key={category.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-black text-lg">{category.name}</h2>
                <span className="text-gray-500 text-sm">{category.products?.length ?? 0} productos</span>
              </div>
              <div className="space-y-2">
                {(category.products as { id: string; name: string; price: number; available: boolean }[])?.map((product) => (
                  <Link
                    key={product.id}
                    href={`/owner/menu/producto/${product.id}`}
                    className="flex items-center justify-between bg-doggo-dark2 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-white font-bold text-sm">{product.name}</p>
                      <p className="text-doggo-yellow text-sm">${product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${product.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {product.available ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="text-gray-400">›</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
