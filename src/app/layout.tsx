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
        <main className="pb-20">
          {children}
        </main>
        <CartBar />
        <BottomNav />
        <InstallPrompt />
      </body>
    </html>
  )
}
