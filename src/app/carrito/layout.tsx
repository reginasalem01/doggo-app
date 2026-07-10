import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tu carrito · Doggo',
  description: 'Revisa tu pedido antes de confirmar.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
