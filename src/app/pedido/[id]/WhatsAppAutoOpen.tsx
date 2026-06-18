'use client'

import { useEffect } from 'react'

export default function WhatsAppAutoOpen() {
  useEffect(() => {
    const url = localStorage.getItem('pendingWhatsApp')
    if (!url) return
    localStorage.removeItem('pendingWhatsApp')
    // Pequeño delay para que la página esté visible antes de abrir WhatsApp
    const t = setTimeout(() => { window.open(url, '_blank') }, 800)
    return () => clearTimeout(t)
  }, [])
  return null
}
