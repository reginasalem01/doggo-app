/**
 * GET /api/contifico/test  — Owner-only
 *
 * Paso 1: Obtiene lista de productos (solo requiere API_KEY + TOKEN)
 * Paso 2: Crea factura de prueba (solo si CONTIFICO_PRODUCTO_GENERICO_ID está configurado)
 */

import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth-guard'
import {
  getProducts,
  createDocument,
  CONSUMIDOR_FINAL,
} from '@/lib/contifico'

export async function GET() {
  const auth = await requireRole('owner'); if (auth) return auth

  if (!process.env.CONTIFICO_API_KEY || !process.env.CONTIFICO_API_TOKEN) {
    return NextResponse.json({
      ok: false,
      env_missing: true,
      message: 'Faltan variables de entorno: CONTIFICO_API_KEY y/o CONTIFICO_API_TOKEN',
    })
  }

  const results: Record<string, unknown> = {}

  // Paso 1: listar productos (para encontrar el producto_id)
  try {
    const products = await getProducts()
    results.products_count = products.length
    results.first_product = products[0] ?? null
    results.all_products = products.slice(0, 10).map((p) => ({ id: p.id, nombre: p.nombre }))
  } catch (e) {
    results.products_error = e instanceof Error ? e.message : String(e)
    // Si falla aquí ya podemos retornar — sin conexión no tiene sentido continuar
    return NextResponse.json({ ok: true, results })
  }

  // Paso 2: crear factura de prueba (solo si ya se configuró el producto genérico)
  const productoId = process.env.CONTIFICO_PRODUCTO_GENERICO_ID
  if (!productoId) {
    results.document_skipped = 'Configura CONTIFICO_PRODUCTO_GENERICO_ID con uno de los IDs de arriba para probar la creación de facturas.'
    return NextResponse.json({ ok: true, results })
  }

  const now = new Date()
  // Use a small fixed sequence for the test invoice
  const testSeq = 999999999

  try {
    const doc = await createDocument(
      {
        numero: '',
        fecha: `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`,
        cliente: CONSUMIDOR_FINAL,
        detalles: [
          {
            producto_id: productoId,
            nombre: 'Venta de prueba Doggo',
            cantidad: 1,
            precio_unitario: 1.00,
          },
        ],
        cobros: [{ forma_cobro: 'EF', monto: 1.00 }],
        referencia: 'TEST-DOGGO-CONTIFICO',
      },
      testSeq
    )
    results.document_created = doc
  } catch (e) {
    results.document_error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json({ ok: true, results })
}
