import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center gap-4 pb-24">
      <span className="text-6xl">🌭</span>
      <h2 className="text-gray-900 text-2xl font-black">Página no encontrada</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Esta página no existe. Vuelve al menú y sigue pidiendo.
      </p>
      <Link
        href="/menu"
        className="bg-doggo-yellow text-doggo-dark font-black px-8 py-3.5 rounded-full text-sm"
      >
        Ver menú
      </Link>
      <Link href="/" className="text-gray-400 text-sm">
        Ir al inicio
      </Link>
    </div>
  )
}
