import { createClient } from '@/lib/supabase/server'
import MenuClient from './MenuClient'
import type { Category, Product } from '@/types'

export default async function MenuPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('products').select('*').eq('available', true).order('sort_order'),
  ])

  return (
    <MenuClient
      categories={(categories ?? []) as Category[]}
      products={(products ?? []) as Product[]}
    />
  )
}
