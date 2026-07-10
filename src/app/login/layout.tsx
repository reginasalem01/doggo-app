import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar sesión · Doggo',
  description: 'Inicia sesión para ganar puntos, ver tus pedidos y canjear recompensas.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
