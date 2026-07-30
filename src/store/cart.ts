import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, ItemCustomization, Product } from '@/types'

interface CartStore {
  items: CartItem[]
  // Plain add — merges by product.id if no customizations
  addItem: (product: Product, quantity?: number) => void
  // Customized add — always creates a new cart entry with a unique ID
  addCustomizedItem: (product: Product, quantity: number, customizations: ItemCustomization) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  subtotal: () => number
  totalItems: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.cartItemId === product.id && !i.customizations
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cartItemId === product.id && !i.customizations
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              { cartItemId: product.id, product, quantity },
            ],
          }
        })
      },

      addCustomizedItem: (product, quantity, customizations) => {
        const cartItemId = crypto.randomUUID()
        set((state) => ({
          items: [
            ...state.items,
            { cartItemId, product, quantity, customizations },
          ],
        }))
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        }))
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartItemId === cartItemId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce((sum, i) => {
          const extra = i.customizations?.extraPrice ?? 0
          return sum + (i.product.price + extra) * i.quantity
        }, 0),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'doggo-cart' }
  )
)
