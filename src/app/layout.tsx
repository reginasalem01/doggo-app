import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/ui/BottomNav'

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
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <BottomNav />
      </body>
    </html>
  )
}
