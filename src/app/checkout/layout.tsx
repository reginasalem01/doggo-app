import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Confirmar pedido · Doggo',
  description: 'Ingresa tus datos y confirma tu pedido.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
