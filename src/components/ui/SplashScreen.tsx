'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Solo mostrar si es la primera vez en esta sesión (apertura del app)
    const shown = sessionStorage.getItem('splashShown')
    if (shown) return
    sessionStorage.setItem('splashShown', '1')
    setVisible(true)
    const fadeTimer = setTimeout(() => setFading(true), 1700)
    const hideTimer = setTimeout(() => setVisible(false), 2200)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1, backgroundColor: '#FDC423' }}
    >
      <Image
        src="/logo-transparent.png"
        alt="Doggo"
        width={320}
        height={320}
        priority
      />
    </div>
  )
}
