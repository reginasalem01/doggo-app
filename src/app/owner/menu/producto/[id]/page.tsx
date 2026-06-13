import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import OwnerProductForm from './OwnerProductForm'

export default async function OwnerProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (id === 'nuevo') {
    const admin = createAdminClient()
    const { data: categories } = await admin.from('categories').select('*').order('sort_order')
    return <OwnerProductForm categories={categories ?? []} />
  }

  const admin = createAdminClient()
  const { data: product } = await admin.from('products').select('*').eq('id', id).single()
  const { data: categories } = await admin.from('categories').select('*').order('sort_order')
  if (!product) notFound()

  return <OwnerProductForm product={product} categories={categories ?? []} />
}