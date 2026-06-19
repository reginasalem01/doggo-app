'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center gap-4 pb-24">
      <span className="text-6xl">😕</span>
      <h2 className="text-gray-900 text-xl font-black">Algo salió mal</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Hubo un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      <button
        onClick={reset}
        className="bg-doggo-yellow text-doggo-dark font-black px-8 py-3.5 rounded-full text-sm"
      >
        Intentar de nuevo
      </button>
      <Link href="/" className="text-gray-400 text-sm">
        Volver al inicio
      </Link>
    </div>
  )
}
