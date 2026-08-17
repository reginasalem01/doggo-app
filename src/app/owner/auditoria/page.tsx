export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function AuditoriaPage() {
  const admin = createAdminClient()

  // Fetch in-person point transactions (those with staff_id set)
  const { data: transactions } = await admin
    .from('loyalty_transactions')
    .select(`
      id,
      points,
      type,
      description,
      invoice_ref,
      staff_id,
      created_at,
      customer_id,
      customers ( name, email, phone )
    `)
    .not('staff_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  // Get staff emails from auth.users (service role can do this)
  const staffIds = [...new Set((transactions ?? []).map((t) => t.staff_id).filter(Boolean) as string[])]
  const staffMap: Record<string, { email?: string }> = {}
  await Promise.all(
    staffIds.map(async (uid) => {
      try {
        const { data: { user } } = await admin.auth.admin.getUserById(uid)
        if (user) staffMap[uid] = { email: user.email }
      } catch { /* ignore */ }
    })
  )

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-gray-900 text-2xl font-black">Auditoría de 🌭 hot dogs</h1>
        <p className="text-gray-400 text-sm mt-1">
          Registro de hot dogs otorgados en local por cada empleado. Solo aparecen transacciones presenciales.
        </p>
      </div>

      {(!transactions || transactions.length === 0) ? (
        <div className="bg-gray-50 rounded-2xl p-10 text-center border border-gray-200">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 font-semibold">Sin transacciones presenciales aún</p>
          <p className="text-gray-400 text-sm mt-1">Aparecerán aquí cuando el staff escanee QR en local</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3">Fecha</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3">Cliente</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3">🌭 Hot dogs</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3">Ref. pago</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3">Empleado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => {
                  const customer = tx.customers as unknown as { name: string; email: string; phone: string } | null
                  const staff = staffMap[tx.staff_id ?? '']
                  const date = new Date(tx.created_at)
                  const dateStr = date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
                  const timeStr = date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-gray-900 font-semibold text-xs">{dateStr}</p>
                        <p className="text-gray-400 text-xs">{timeStr}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 font-semibold">{customer?.name ?? '—'}</p>
                        <p className="text-gray-400 text-xs">{customer?.phone ?? customer?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 font-black text-sm ${
                          tx.points > 0 ? 'text-green-600' : 'text-doggo-red'
                        }`}>
                          {tx.points > 0 ? '+' : ''}{tx.points}
                          <span className="text-xs font-normal text-gray-400">🌭</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {tx.invoice_ref ? (
                          <span className="bg-gray-100 text-gray-700 text-xs font-mono px-2 py-1 rounded-lg">
                            {tx.invoice_ref}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 text-xs font-semibold">
                          {staff?.email ?? `ID: ${tx.staff_id?.slice(0, 8)}…`}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <p className="text-amber-800 font-black text-sm mb-1">¿Cómo revisar por empleado?</p>
        <p className="text-amber-700 text-xs leading-relaxed">
          Busca el nombre del empleado en la columna Empleado. Si ves muchas transacciones sin referencia de pago clara,
          o montos inusuales, investiga con ese staff. Cada transacción presencial requiere número de factura o referencia de pago.
        </p>
      </div>
    </div>
  )
}
