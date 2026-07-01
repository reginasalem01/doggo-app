'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import DoggoLogo from '@/components/ui/DoggoLogo'
import { formatPrice } from '@/lib/utils'

const DATAFAST_BASE_URL = process.env.NEXT_PUBLIC_DATAFAST_BASE_URL ?? 'https://test.oppwa.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? ''

function PagoContent() {
  const searchParams  = useSearchParams()
  const orderId       = searchParams.get('orderId')

  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [total, setTotal]           = useState<number | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)
  const [widgetReady, setWidgetReady] = useState(false)

  useEffect(() => {
    if (!orderId) { setError('Pedido no encontrado'); setLoading(false); return }

    fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.checkoutId) {
          setCheckoutId(data.checkoutId)
          if (data.total) setTotal(data.total)
        } else {
          setError(data.error ?? 'No se pudo iniciar el pago')
        }
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false))
  }, [orderId])

  // URL a la que Datafast redirige después del pago
  const shopperResultUrl = `${SITE_URL}/pago/resultado?orderId=${orderId}`

  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-5xl mb-4">😕</span>
        <p className="text-gray-900 font-bold mb-4">Pedido no encontrado</p>
        <Link href="/" className="bg-doggo-yellow text-doggo-dark font-black px-6 py-3 rounded-full text-sm">
          Ir al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-sm mx-auto">
      {/* Monto a pagar */}
      {total && (
        <div className="bg-doggo-yellow/10 border border-doggo-yellow/30 rounded-2xl px-5 py-4 mb-5 text-center">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Total a pagar</p>
          <p className="text-doggo-dark font-black text-3xl">{formatPrice(total)}</p>
        </div>
      )}

      {/* Sello de seguridad */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-green-500">🔒</span>
        <p className="text-gray-500 text-sm">Pago 100% seguro — Datafast</p>
        <span className="text-gray-300 text-xs">·</span>
        <span className="text-gray-400 text-xs">VISA · MASTER · AMEX</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <div className="w-8 h-8 border-4 border-doggo-yellow border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Preparando pago seguro…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-gray-900 font-bold text-sm">No se pudo iniciar el pago</p>
          <p className="text-gray-500 text-xs mt-1 mb-4">{error}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setError(null); setLoading(true); window.location.reload() }}
              className="bg-doggo-yellow text-doggo-dark font-black px-6 py-2.5 rounded-full text-sm"
            >
              Reintentar
            </button>
            <Link href={`/pedido/${orderId}`} className="text-gray-400 text-sm text-center py-1">
              Ver estado del pedido
            </Link>
          </div>
        </div>
      )}

      {/* Widget Datafast */}
      {checkoutId && (
        <>
          {/* Script de prevención de fraude (requerido por Datafast) */}
          <Script
            src="https://www.datafast.com.ec/js/dfAdditionalValidations1.js"
            strategy="beforeInteractive"
          />
          {/* Script del widget con el checkoutId */}
          <Script
            src={`${DATAFAST_BASE_URL}/v1/paymentWidgets.js?checkoutId=${checkoutId}`}
            strategy="afterInteractive"
            onLoad={() => setWidgetReady(true)}
          />

          {/* Formulario de pago — Datafast inyecta los campos de tarjeta aquí */}
          <form
            action={shopperResultUrl}
            className="paymentWidgets"
            data-brands="VISA MASTER DINERS DISCOVER AMEX"
          />

          {!widgetReady && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-6 h-6 border-2 border-doggo-yellow border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-xs">Cargando formulario…</p>
            </div>
          )}
        </>
      )}

      {/* Link de vuelta */}
      {!loading && !error && orderId && (
        <p className="text-center mt-6">
          <Link href={`/pedido/${orderId}`} className="text-gray-400 text-xs">
            ← Ver estado del pedido
          </Link>
        </p>
      )}
    </div>
  )
}

export default function PagoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <DoggoLogo size={36} />
        <h1 className="text-gray-900 text-xl font-black">Pagar pedido</h1>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-doggo-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <PagoContent />
      </Suspense>
    </div>
  )
}
