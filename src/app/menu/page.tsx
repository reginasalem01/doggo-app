import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Menú · Doggo',
  description: 'Explora nuestro menú de hot dogs, bebidas y más. Pide en línea y recibe en tu mesa o a domicilio.',
}
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
