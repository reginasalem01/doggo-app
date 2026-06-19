import { createAdminClient } from '@/lib/supabase/admin'
import RealtimeReservas from './RealtimeReservas'

export default async function AdminReservasPage() {
  const admin = createAdminClient()
  const { data: reservations } = await admin
    .from('reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  return <RealtimeReservas initial={reservations ?? []} />
}
