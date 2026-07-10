import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pagar pedido · Doggo',
  description: 'Completa tu pago de forma segura con Datafast.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
