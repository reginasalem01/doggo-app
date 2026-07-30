/**
 * POST /api/contifico/setup — Owner-only
 * Crea el producto "Venta Doggo" en Contífico y retorna su ID.
 * Solo correr una vez.
 */

import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth-guard'

const BASE_URL = 'https://api.contifico.com/sistema/api/v1'

export async function POST() {
  const auth = await requireRole('owner'); if (auth) return auth

  const apiKey = process.env.CONTIFICO_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'CONTIFICO_API_KEY no configurado' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`${BASE_URL}/producto/`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: 'Venta Doggo',
        codigo: 'DOGGO-001',
        descripcion: 'Producto genérico para ventas desde la app Doggo',
        precio_venta: 1.00,
        porcentaje_iva: parseInt(process.env.CONTIFICO_IVA_RATE ?? '15', 10),
        tipo: 'S',  // S = Servicio
        estado: 'A',
      }),
      signal: controller.signal,
    })

    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: `Contífico: ${res.status} — ${text}` }, { status: 500 })
    }

    const data = JSON.parse(text)
    return NextResponse.json({ ok: true, product: data, id: data.id })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  } finally {
    clearTimeout(timeout)
  }
}
