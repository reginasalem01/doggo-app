'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DoggoLogo from '@/components/ui/DoggoLogo'

function ResultadoContent() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const orderId       = searchParams.get('orderId')
  const resourcePath  = searchParams.get('resourcePath')

  const [state, setState] = useState<'loading' | 'approved' | 'rejected' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!orderId || !resourcePath) {
      setState('error')
      setErrorMsg('Parámetros de pago inválidos')
      return
    }

    fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, resourcePath }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setState('error')
          setErrorMsg(data.error)
          return
        }
        if (data.approved || data.alreadyProcessed) {
          setState('approved')
          // Redirigir al pedido después de 2.5s
          setRedirecting(true)
          setTimeout(() => router.push(`/pedido/${orderId}`), 2500)
        } else {
          setState('rejected')
          setErrorMsg(data.description ?? 'Pago no aprobado')
        }
      })
      .catch(() => {
        setState('error')
        setErrorMsg('Error de conexión al verificar el pago')
      })
  }, [orderId, resourcePath, router])

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 gap-5">
        <div className="w-12 h-12 border-4 border-doggo-yellow border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-gray-900 font-black text-lg">Verificando pago…</p>
          <p className="text-gray-400 text-sm mt-1">Un momento por favor</p>
        </div>
      </div>
    )
  }

  if (state === 'approved') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-5">
        {/* Checkmark animado */}
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-5xl">
          ✅
        </div>

        <div>
          <p className="text-gray-900 font-black text-2xl">¡Pago exitoso!</p>
          <p className="text-gray-500 text-sm mt-2">Tu pedido está confirmado y en preparación 🐶</p>
        </div>

        {redirecting && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            Yendo a tu pedido…
          </div>
        )}

        <Link
          href={`/pedido/${orderId}`}
          className="bg-doggo-yellow text-doggo-dark font-black px-8 py-3.5 rounded-full text-sm mt-2"
        >
          Ver mi pedido →
        </Link>
      </div>
    )
  }

  if (state === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-5">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-5xl">
          ❌
        </div>

        <div>
          <p className="text-gray-900 font-black text-2xl">Pago rechazado</p>
          {errorMsg && (
            <p className="text-gray-500 text-sm mt-2">{errorMsg}</p>
          )}
          <p className="text-gray-400 text-xs mt-2">
            Tu pedido fue creado. Puedes intentar el pago de nuevo.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <Link
            href={`/pago?orderId=${orderId}`}
            className="bg-doggo-yellow text-doggo-dark font-black px-6 py-3.5 rounded-full text-sm text-center"
          >
            Reintentar pago
          </Link>
          <Link
            href={`/pedido/${orderId}`}
            className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-full text-sm text-center"
          >
            Ver estado del pedido
          </Link>
        </div>
      </div>
    )
  }

  // error state
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-5">
      <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-5xl">
        😕
      </div>

      <div>
        <p className="text-gray-900 font-black text-xl">Algo salió mal</p>
        {errorMsg && (
          <p className="text-gray-500 text-sm mt-2">{errorMsg}</p>
        )}
        <p className="text-gray-400 text-xs mt-2">
          Si tu pago fue debitado, contáctanos por WhatsApp.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
        {orderId && (
          <Link
            href={`/pedido/${orderId}`}
            className="bg-doggo-yellow text-doggo-dark font-black px-6 py-3.5 rounded-full text-sm text-center"
          >
            Ver mi pedido
          </Link>
        )}
        <Link
          href="/"
          className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-full text-sm text-center"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}

export default function ResultadoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <DoggoLogo size={36} />
        <h1 className="text-gray-900 text-xl font-black">Resultado del pago</h1>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-doggo-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ResultadoContent />
      </Suspense>
    </div>
  )
}
