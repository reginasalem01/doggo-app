import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/ui/BottomNav'
import CartBar from '@/components/ui/CartBar'
import InstallPrompt from '@/components/ui/InstallPrompt'

export const metadata: Metadata = {
  title: 'Doggo · Hotdog sin dramas',
  description: 'Pide, gana puntos y reserva tu mesa en Doggo. Plaza Guayarte, Guayaquil.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Doggo',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#FEC523',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {/* Cubre la zona de la barra de estado con fondo blanco */}
        <div className="fixed top-0 left-0 right-0 pt-safe bg-white z-50 pointer-events-none" />
        <main className="pb-20 pt-safe">
          {children}
        </main>
        <CartBar />
        <BottomNav />
        <InstallPrompt />
      </body>
    </html>
  )
}
