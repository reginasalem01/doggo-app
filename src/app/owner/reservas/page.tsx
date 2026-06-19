import { createAdminClient } from '@/lib/supabase/admin'
import RealtimeReservasOwner from './RealtimeReservasOwner'

export default async function OwnerReservasPage() {
  const admin = createAdminClient()
  const { data: reservations } = await admin
    .from('reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })
    .limit(200)

  return <RealtimeReservasOwner initial={reservations ?? []} />
}
