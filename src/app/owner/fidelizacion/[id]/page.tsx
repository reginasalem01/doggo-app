import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import RewardForm from '../RewardForm'

export default async function EditRewardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: reward } = await admin.from('rewards').select('*').eq('id', id).single()
  if (!reward) notFound()

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/fidelizacion" className="text-gray-400 hover:text-white text-sm">← Fidelización</Link>
        <h1 className="text-white text-2xl font-black">Editar premio</h1>
      </div>
      <RewardForm reward={{
        id: reward.id,
        name: reward.name,
        description: reward.description ?? '',
        points_required: reward.points_required,
        active: reward.active,
        expires_at: reward.expires_at ?? '',
      }} />
    </div>
  )
}
