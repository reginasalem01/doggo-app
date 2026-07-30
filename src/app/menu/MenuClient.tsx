'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { Category, Product, ItemCustomization } from '@/types'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { formatPrice } from '@/lib/utils'
import {
  HOTDOG_CATEGORY_NAMES,
  FREE_SALSAS,
  FREE_EXTRAS,
  PAID_TOPPINGS,
} from '@/lib/hotdog-options'
import CartIcon from '@/components/ui/CartIcon'

interface Props {
  categories: Category[]
  products: Product[]
  isOpen: boolean
  closedReason: string
  openTime: string
  closeTime: string
}

export default function MenuClient({ categories, products, isOpen, closedReason, openTime, closeTime }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { addItem, addCustomizedItem } = useCartStore()

  // Determine which category IDs are hotdog categories
  const hotdogCatIds = new Set(
    categories
      .filter((c) => HOTDOG_CATEGORY_NAMES.includes(c.name))
      .map((c) => c.id)
  )

  const filtered = activeCategory
    ? products.filter((p) => p.category_id === activeCategory)
    : products

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-safe z-20 border-b border-gray-200">
        <h1 className="text-gray-900 text-xl font-black">Menú</h1>
        <CartIcon />
      </div>

      {/* Closed banner */}
      {!isOpen && (
        <div className="mx-4 mt-3 bg-doggo-red/10 border border-doggo-red/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🕐</span>
          <div>
            <p className="text-doggo-red font-black text-sm">{closedReason}</p>
            <p className="text-gray-500 text-xs mt-0.5">Horario: {openTime} – {closeTime}</p>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveCategory(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            activeCategory === null
              ? 'bg-doggo-yellow text-doggo-dark'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          Todo
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              activeCategory === cat.id
                ? 'bg-doggo-yellow text-doggo-dark'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="px-4 pb-28 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🌭</p>
            <p className="font-semibold">No hay productos disponibles</p>
          </div>
        )}
        {filtered.map((product) => {
          const isHotdog = hotdogCatIds.has(product.category_id)
          return (
            <ProductCard
              key={product.id}
              product={product}
              isOpen={isOpen}
              isHotdog={isHotdog}
              onOpen={() => setSelectedProduct(product)}
              onQuickAdd={() => {
                if (isOpen && !isHotdog) addItem(product, 1)
              }}
            />
          )
        })}
      </div>

      {/* Product detail / customization modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isHotdog={hotdogCatIds.has(selectedProduct.category_id)}
          onClose={() => setSelectedProduct(null)}
          onAdd={(customizations, qty) => {
            if (customizations) {
              addCustomizedItem(selectedProduct, qty, customizations)
            } else {
              addItem(selectedProduct, qty)
            }
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({
  product,
  isOpen,
  isHotdog,
  onOpen,
  onQuickAdd,
}: {
  product: Product
  isOpen: boolean
  isHotdog: boolean
  onOpen: () => void
  onQuickAdd: () => void
}) {
  const [quickAdded, setQuickAdded] = useState(false)

  function handleQuickAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (isHotdog) {
      // Force modal for hotdogs (need to select options)
      onOpen()
      return
    }
    onQuickAdd()
    setQuickAdded(true)
    setTimeout(() => setQuickAdded(false), 1200)
  }

  return (
    <div
      onClick={onOpen}
      className="w-full bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100 text-left active:scale-[0.99] transition-transform cursor-pointer"
    >
      {/* Image */}
      <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">🌭</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 font-bold text-sm leading-tight">{product.name}</p>
        {product.description && (
          <p className="text-gray-500 text-xs mt-0.5 leading-snug line-clamp-2">
            {product.description}
          </p>
        )}
        <p className="text-doggo-red font-black text-base mt-1">
          {formatPrice(product.price)}
        </p>
        {isHotdog && (
          <p className="text-gray-400 text-[10px] mt-0.5">Toca para personalizar</p>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={handleQuickAdd}
        disabled={!isOpen}
        title={!isOpen ? 'Fuera de horario' : undefined}
        className={`flex-shrink-0 w-9 h-9 rounded-full font-black text-lg flex items-center justify-center transition-all ${
          !isOpen ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
          quickAdded ? 'bg-green-500 text-white' : 'bg-doggo-yellow text-doggo-dark'
        }`}
      >
        {quickAdded ? '✓' : '+'}
      </button>
    </div>
  )
}

// ── Product modal with customization options ──────────────────────────────────

function ProductModal({
  product,
  isHotdog,
  onClose,
  onAdd,
}: {
  product: Product
  isHotdog: boolean
  onClose: () => void
  onAdd: (customizations: ItemCustomization | null, qty: number) => void
}) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { openModal, closeModal } = useUIStore()

  // Customization state
  const [salsas, setSalsas] = useState<string[]>([])
  const [extras, setExtras] = useState<string[]>([])
  const [paidToppings, setPaidToppings] = useState<string[]>([])
  const [removeNotes, setRemoveNotes] = useState('')

  useEffect(() => {
    openModal()
    return () => closeModal()
  }, [openModal, closeModal])

  const extraPrice = parseFloat((paidToppings.length * 1.25).toFixed(2))
  const unitTotal = product.price + extraPrice
  const lineTotal = unitTotal * qty

  function toggle<T>(list: T[], item: T, setList: (l: T[]) => void) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  }

  function handleAdd() {
    if (isHotdog) {
      const customizations: ItemCustomization = {
        salsas,
        extras,
        paidToppings,
        extraPrice,
        notes: removeNotes,
      }
      onAdd(customizations, qty)
    } else {
      onAdd(null, qty)
    }
    setAdded(true)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Image */}
        {product.image_url ? (
          <div className="w-full h-48 flex-shrink-0 overflow-hidden">
            <Image
              src={product.image_url}
              alt={product.name}
              width={600}
              height={192}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-7xl">🌭</span>
          </div>
        )}

        {/* Scrollable content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">

          {/* Name + price */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-gray-900 text-xl font-black leading-tight flex-1">{product.name}</h2>
            <p className="text-doggo-red font-black text-xl flex-shrink-0">{formatPrice(product.price)}</p>
          </div>

          {product.description && (
            <p className="text-gray-500 text-sm leading-relaxed -mt-3">{product.description}</p>
          )}

          {/* Hotdog customization options */}
          {isHotdog && (
            <>
              {/* SALSAS GRATIS */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <p className="text-gray-900 font-black text-sm">Salsas</p>
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">GRATIS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FREE_SALSAS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggle(salsas, s, setSalsas)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        salsas.includes(s)
                          ? 'bg-doggo-yellow text-doggo-dark border-doggo-yellow'
                          : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {salsas.includes(s) ? '✓ ' : ''}{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* EXTRAS GRATIS */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <p className="text-gray-900 font-black text-sm">Extras</p>
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">GRATIS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FREE_EXTRAS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => toggle(extras, e, setExtras)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        extras.includes(e)
                          ? 'bg-doggo-yellow text-doggo-dark border-doggo-yellow'
                          : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {extras.includes(e) ? '✓ ' : ''}{e}
                    </button>
                  ))}
                </div>
              </div>

              {/* TOPPINGS CON COSTO */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <p className="text-gray-900 font-black text-sm">Toppings extra</p>
                  <span className="bg-doggo-red/10 text-doggo-red text-[10px] font-black px-2 py-0.5 rounded-full">+$1.25 c/u</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PAID_TOPPINGS.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => toggle(paidToppings, t.name, setPaidToppings)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        paidToppings.includes(t.name)
                          ? 'bg-doggo-red text-white border-doggo-red'
                          : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {paidToppings.includes(t.name) ? '✓ ' : ''}{t.name}
                    </button>
                  ))}
                </div>
                {paidToppings.length > 0 && (
                  <p className="text-doggo-red text-xs font-semibold mt-2">
                    +{formatPrice(extraPrice)} por toppings seleccionados
                  </p>
                )}
              </div>

              {/* QUITAR / NOTAS */}
              <div>
                <p className="text-gray-900 font-black text-sm mb-2">Quitar ingredientes <span className="text-gray-400 font-normal">(opcional)</span></p>
                <textarea
                  value={removeNotes}
                  onChange={(e) => setRemoveNotes(e.target.value)}
                  placeholder="Ej: sin cebolla, sin tomate..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 resize-none"
                />
              </div>
            </>
          )}

          {/* Notes for non-hotdog items */}
          {!isHotdog && (
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1.5 uppercase tracking-wide">
                Notas (opcional)
              </label>
              <textarea
                value={removeNotes}
                onChange={(e) => setRemoveNotes(e.target.value)}
                placeholder="Sin cebolla, extra queso..."
                rows={2}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-doggo-yellow/40 resize-none"
              />
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-5 pb-6 pt-3 border-t border-gray-100 flex items-center gap-3 bg-white">
          <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
            <button
              type="button"
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-8 h-8 rounded-full bg-white text-gray-900 font-bold text-lg flex items-center justify-center shadow-sm"
            >
              −
            </button>
            <span className="text-gray-900 font-black w-5 text-center">{qty}</span>
            <button
              type="button"
              onClick={() => setQty(qty + 1)}
              className="w-8 h-8 rounded-full bg-white text-gray-900 font-bold text-lg flex items-center justify-center shadow-sm"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={added}
            className={`flex-1 py-3 rounded-full font-black text-sm transition-all ${
              added ? 'bg-green-500 text-white' : 'bg-doggo-yellow text-doggo-dark'
            }`}
          >
            {added ? '✓ Agregado' : `Agregar · ${formatPrice(lineTotal)}`}
          </button>
        </div>
      </div>
    </>
  )
}
