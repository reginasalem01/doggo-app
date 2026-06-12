import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-doggo-dark flex flex-col">
      {/* Status bar */}
      <div className="bg-doggo-dark px-4 py-3 flex justify-between items-center">
        <span className="text-white text-xs font-medium">9:41</span>
        <span className="text-white text-xs">● ● ▲ 🔋</span>
      </div>

      {/* Header */}
      <div className="bg-doggo-dark2 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-doggo-yellow text-2xl font-black tracking-tight">DOGGO</h1>
          <p className="text-gray-400 text-xs">Plaza Guayarte · Guayaquil</p>
        </div>
        <Link href="/carrito" className="relative">
          <span className="text-2xl">🛒</span>
        </Link>
      </div>

      {/* Hero banner */}
      <div className="mx-4 mt-4 bg-doggo-red rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-doggo-yellow text-xs font-bold uppercase tracking-wider">Oferta del día</p>
          <h2 className="text-white text-xl font-black mt-1 leading-tight">
            2×1 en<br />Hot Dogs 🌭
          </h2>
          <Link
            href="/menu"
            className="mt-3 inline-block bg-doggo-yellow text-doggo-dark text-sm font-bold px-4 py-2 rounded-full"
          >
            Ordenar ahora →
          </Link>
        </div>
        <span className="text-6xl">🌭</span>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mx-4 mt-4">
        {[
          { emoji: '🍔', label: 'Menú', href: '/menu' },
          { emoji: '📅', label: 'Reservar', href: '/reservas' },
          { emoji: '⭐', label: 'Mis puntos', href: '/puntos' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-doggo-dark2 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-doggo-dark3 transition-colors"
          >
            <span className="text-3xl">{action.emoji}</span>
            <span className="text-white text-xs font-semibold">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Featured section */}
      <div className="mx-4 mt-6">
        <h2 className="text-white text-lg font-black mb-3">Lo más pedido</h2>
        <div className="space-y-3">
          {[
            { name: 'Hot Dog Clásico', price: '$3.50', emoji: '🌭', desc: 'Salchicha, mostaza, ketchup' },
            { name: 'Hot Dog Hawaiano', price: '$4.25', emoji: '🍍', desc: 'Salchicha, piña, salsa especial' },
            { name: 'Combo Doggo', price: '$5.99', emoji: '🎉', desc: 'HD Clásico + bebida + papas' },
          ].map((item) => (
            <div key={item.name} className="bg-doggo-dark2 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{item.emoji}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{item.name}</p>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-doggo-yellow font-bold text-sm">{item.price}</span>
                <Link
                  href="/menu"
                  className="bg-doggo-yellow text-doggo-dark text-xs font-bold px-3 py-1 rounded-full"
                >
                  + Añadir
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loyalty teaser */}
      <div className="mx-4 mt-4 mb-4 bg-doggo-dark2 rounded-2xl p-4 flex items-center gap-4">
        <span className="text-4xl">⭐</span>
        <div>
          <p className="text-doggo-yellow text-sm font-bold">Programa de puntos</p>
          <p className="text-gray-400 text-xs mt-0.5">Gana 1 punto por cada $1. Canjea recompensas exclusivas.</p>
          <Link href="/puntos" className="text-doggo-yellow text-xs font-bold mt-1 inline-block">
            Ver mis puntos →
          </Link>
        </div>
      </div>
    </div>
  )
}
