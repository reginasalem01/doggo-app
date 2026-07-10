import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservar mesa · Doggo',
  description: 'Reserva tu mesa en Doggo, Plaza Guayarte. Rápido y sin llamadas.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
