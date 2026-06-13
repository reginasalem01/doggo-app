import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ProductForm from '../ProductForm'

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: product } = await admin.from('products').select('*').eq('id', id).single()
  if (!product) notFound()
  return <ProductForm product={product} />
}