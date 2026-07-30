/**
 * Cliente para la API de Contífico
 * Docs: http://contifico.github.io/
 *
 * Variables de entorno requeridas:
 *   CONTIFICO_API_KEY   — Clave de autenticación (header Authorization)
 *   CONTIFICO_API_TOKEN — UUID del POS (campo "pos" en cada documento)
 *   CONTIFICO_ESTABLECIMIENTO — Código establecimiento, ej: "001"
 *   CONTIFICO_EMISION   — Punto de emisión, ej: "001"
 *   CONTIFICO_IVA_RATE  — Tasa de IVA actual: 15 (Ecuador 2024) o 0 para exento
 *   CONTIFICO_PRODUCTO_GENERICO_ID — ID del producto "Venta Doggo" en Contífico
 *
 * Para DEMO (sandbox):
 *   CONTIFICO_API_KEY=FrguR1kDpFHaXHLQwplZ2CwTX3p8p9XHVTnukL98V5U
 *   CONTIFICO_API_TOKEN=dce704ae-189e-4545-bea3-257d9249a594
 */

const BASE_URL = 'https://api.contifico.com/sistema/api/v1'

function headers() {
  return {
    'Authorization': process.env.CONTIFICO_API_KEY ?? '',
    'Content-Type': 'application/json',
  }
}

function apiToken() {
  return process.env.CONTIFICO_API_TOKEN ?? ''
}

function ivaRate(): number {
  return parseInt(process.env.CONTIFICO_IVA_RATE ?? '15', 10)
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ContificoProduct {
  id: string
  nombre: string
  precio_venta: number
  porcentaje_iva: number
  codigo: string
}

export type FormaCobro =
  | 'EF'  // Efectivo
  | 'TC'  // Tarjeta de crédito/débito (Datafast, etc.)
  | 'CH'  // Cheque
  | 'TR'  // Transferencia

export interface CreateDocumentParams {
  /** Número de documento en formato 001-001-000000001 */
  numero: string
  /** Fecha de emisión en formato DD/MM/YYYY */
  fecha: string
  /** Datos del cliente */
  cliente: {
    cedula: string
    razon_social: string
    tipo: 'N' | 'J' | 'I'
    email?: string | null
    telefonos?: string | null
  }
  /** Líneas del documento */
  detalles: Array<{
    producto_id: string
    nombre: string
    cantidad: number
    precio_unitario: number
  }>
  /** Forma de cobro + monto */
  cobros: Array<{
    forma_cobro: FormaCobro
    monto: number
    tipo_ping?: 'D'  // 'D' = Datafast (solo para TC)
  }>
  /** Texto libre para identificar el pedido (va en descripcion y adicional1) */
  referencia: string
}

export interface ContificoDocumentResult {
  id: string
  documento: string
  estado: string
}

// ── Consumidor final ──────────────────────────────────────────────────────────

/** Cliente genérico para ventas sin identificación del comprador */
export const CONSUMIDOR_FINAL = {
  cedula: '9999999999',
  razon_social: 'CONSUMIDOR FINAL',
  tipo: 'I' as const,
  email: null,
  telefonos: null,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDocumentNumber(sequence: number): string {
  const est = (process.env.CONTIFICO_ESTABLECIMIENTO ?? '001').padStart(3, '0')
  const emi = (process.env.CONTIFICO_EMISION ?? '001').padStart(3, '0')
  // Contífico requires exactly 9 digits for the sequence (total format: 001-001-000000001)
  const seq = String(sequence % 1000000000).padStart(9, '0')
  return `${est}-${emi}-${seq}`
}

function ecuadorDate(date: Date = new Date()): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

function buildDetalles(items: CreateDocumentParams['detalles']) {
  const rate = ivaRate()
  return items.map((item) => {
    const precio = Math.round(item.precio_unitario * 100) / 100
    const baseGravable = rate > 0 ? Math.round(precio * item.cantidad * 100) / 100 : 0
    const baseCero = rate === 0 ? Math.round(precio * item.cantidad * 100) / 100 : 0
    return {
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio,
      porcentaje_iva: rate,
      porcentaje_descuento: 0,
      base_cero: baseCero,
      base_gravable: baseGravable,
      base_no_gravable: 0,
    }
  })
}

function buildTotals(items: CreateDocumentParams['detalles']) {
  const rate = ivaRate()
  const subtotal = items.reduce((s, i) => s + Math.round(i.precio_unitario * i.cantidad * 100) / 100, 0)
  const subtotalRounded = Math.round(subtotal * 100) / 100
  const iva = rate > 0 ? Math.round(subtotalRounded * rate / 100 * 100) / 100 : 0
  return {
    subtotal_0: rate === 0 ? subtotalRounded : 0,
    subtotal_12: 0,  // unused: Ecuador now at 15%
    subtotal_gravable: rate > 0 ? subtotalRounded : 0,
    iva,
    total: Math.round((subtotalRounded + iva) * 100) / 100,
  }
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Consulta todos los productos del catálogo de Contífico.
 * Útil para encontrar el producto_id de "Venta Doggo" u otros.
 */
export async function getProducts(): Promise<ContificoProduct[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const res = await fetch(`${BASE_URL}/producto/`, {
      headers: headers(),
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Contífico getProducts: ${res.status} ${await res.text()}`)
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Crea un documento electrónico (factura) en Contífico y lo cobra en el mismo request.
 * Retorna el ID interno de Contífico del documento creado.
 */
export async function createDocument(
  params: CreateDocumentParams,
  sequence: number
): Promise<ContificoDocumentResult> {
  const totals = buildTotals(params.detalles)
  const rate = ivaRate()

  // Construct the document body
  // Note: Contífico still uses the field name "subtotal_12" for the taxable base,
  // but the actual iva field should reflect the real amount at current rate.
  // The porcentaje_iva in detalles controls the actual rate per line.
  const body = {
    pos: apiToken(),
    fecha_emision: params.fecha,
    tipo_documento: 'FAC',
    documento: buildDocumentNumber(sequence),
    estado: 'C',       // C = cobrado (paid immediately)
    electronico: true,
    autorizacion: '',
    caja_id: null,
    cliente: {
      cedula: params.cliente.cedula,
      razon_social: params.cliente.razon_social,
      tipo: params.cliente.tipo,
      telefonos: params.cliente.telefonos ?? '',
      direccion: '',
      email: params.cliente.email ?? '',
      es_extranjero: false,
    },
    vendedor: '',
    descripcion: params.referencia,
    subtotal_0: totals.subtotal_0,
    subtotal_12: totals.subtotal_gravable,  // taxable base regardless of actual rate
    iva: totals.iva,
    ice: 0,
    servicio: 0,
    total: totals.total,
    adicional1: params.referencia,
    adicional2: '',
    detalles: buildDetalles(params.detalles),
    cobros: params.cobros.map((c) => ({
      forma_cobro: c.forma_cobro,
      monto: totals.total,
      ...(c.tipo_ping ? { tipo_ping: c.tipo_ping } : {}),
    })),
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  const res = await fetch(`${BASE_URL}/documento/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout))

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Contífico createDocument: ${res.status} — ${text}`)
  }

  const data = JSON.parse(text)
  return {
    id: data.id ?? data.documento_id ?? '',
    documento: data.documento ?? buildDocumentNumber(sequence),
    estado: data.estado ?? 'C',
  }
}

/**
 * Devuelve si Contífico está configurado (todas las env vars presentes).
 */
export function isContificoConfigured(): boolean {
  return !!(
    process.env.CONTIFICO_API_KEY &&
    process.env.CONTIFICO_API_TOKEN &&
    process.env.CONTIFICO_PRODUCTO_GENERICO_ID
  )
}
