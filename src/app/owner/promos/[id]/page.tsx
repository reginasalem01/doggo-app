import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PromoForm from '../PromoForm'

export default async function EditPromoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: promo } = await admin.from('promotions').select('*').eq('id', id).single()
  if (!promo) notFound()

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/promos" className="text-gray-400 hover:text-gray-700 text-sm">← Promos</Link>
        <h1 className="text-gray-900 text-2xl font-black">Editar promo</h1>
      </div>
      <PromoForm promo={{
        id: promo.id,
        title: promo.title,
        description: promo.description ?? '',
        image_url: promo.image_url ?? '',
        active: promo.active,
        starts_at: promo.starts_at ?? '',
        ends_at: promo.ends_at ?? '',
      }} />
    </div>
  )
}
