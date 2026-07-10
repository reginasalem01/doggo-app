import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configuración · Doggo',
  description: 'Administra tu cuenta, datos personales y contraseña.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
