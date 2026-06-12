'use client'

import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore()
  const sub = subtotal()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-doggo-dark flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-6xl">🛒</span>
        <h2 className="text-white text-xl font-black">Tu carrito está vacío</h2>
        <p className="text-gray-400 text-sm text-center">
          Agrega algo del menú y aparecerá aquí
        </p>
        <Link
          href="/menu"
          className="mt-2 bg-doggo-yellow text-doggo-dark font-bold px-6 py-3 rounded-full"
        >
          Ver menú
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-doggo-dark flex flex-col">
      {/* Header */}
      <div className="bg-doggo-dark2 px-4 py-4 flex items-center gap-3">
        <Link href="/menu" className="text-gray-400 text-2xl leading-none">‹</Link>
        <h1 className="text-white text-xl font-black">Tu pedido</h1>
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {items.map((item) => (
          <div key={item.product.id} className="bg-doggo-dark2 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{item.product.name}</p>
                <p className="text-doggo-yellow text-sm font-bold mt-1">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-gray-500 text-xs">
                    {formatPrice(item.product.price)} c/u
                  </p>
                )}
              </div>
              <button
                onClick={() => removeItem(item.product.id)}
                className="text-gray-500 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-doggo-dark3 text-white font-bold flex items-center justify-center text-lg"
              >
                −
              </button>
              <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-doggo-yellow text-doggo-dark font-bold flex items-center justify-center text-lg"
              >
                +
              </button>
            </div>
          </div>
        ))}

        {/* Add more */}
        <Link
          href="/menu"
          className="block text-center text-doggo-yellow text-sm font-bold py-3 border border-doggo-dark3 rounded-xl"
        >
          + Agregar más productos
        </Link>
      </div>

      {/* Order summary */}
      <div className="bg-doggo-dark2 px-4 py-5 mx-4 mb-4 rounded-2xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Subtotal</span>
          <span className="text-white font-bold">{formatPrice(sub)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Envío</span>
          <span className="text-gray-400 text-sm italic">Se calcula al pedir</span>
        </div>
        <div className="border-t border-doggo-dark3 mt-3 pt-3 flex justify-between items-center">
          <span className="text-white font-black">Total</span>
          <span className="text-doggo-yellow font-black text-lg">{formatPrice(sub)}</span>
        </div>

        <Link
          href="/checkout"
          className="mt-4 block w-full bg-doggo-yellow text-doggo-dark text-center font-black py-4 rounded-full text-base"
        >
          Confirmar pedido →
        </Link>
      </div>
    </div>
  )
}
