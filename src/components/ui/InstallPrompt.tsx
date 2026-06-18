'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Ya instalada → no mostrar
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Ya descartada esta sesión
    if (sessionStorage.getItem('installDismissed')) return

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)

    if (isIOS && isSafari) {
      setShowIOS(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => void })
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem('installDismissed', '1')
    setDismissed(true)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    dismiss()
  }

  if (dismissed || (!showAndroid && !showIOS)) return null

  // ── ANDROID / CHROME ──────────────────────────────────────
  if (showAndroid) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[398px] z-[999] bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="Doggo" className="w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-black text-sm leading-tight">Instala Doggo</p>
          <p className="text-gray-400 text-xs">Accede directo sin abrir el browser</p>
        </div>
        <button
          onClick={install}
          className="bg-doggo-yellow text-doggo-dark font-black text-xs px-4 py-2 rounded-xl shrink-0"
        >
          Instalar
        </button>
        <button onClick={dismiss} className="text-gray-300 text-lg leading-none shrink-0">×</button>
      </div>
    )
  }

  // ── iOS / SAFARI ──────────────────────────────────────────
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[398px] z-[999] bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="Doggo" className="w-11 h-11 rounded-xl shrink-0" />
          <div>
            <p className="text-gray-900 font-black text-sm">Instala Doggo</p>
            <p className="text-gray-400 text-xs">Accede directo desde tu pantalla</p>
          </div>
        </div>
        <button onClick={dismiss} className="text-gray-300 text-xl leading-none">×</button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
          <span className="text-xl shrink-0">📤</span>
          <p className="text-gray-600 text-xs">Toca el botón de <strong>Compartir</strong> en Safari</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
          <span className="text-xl shrink-0">➕</span>
          <p className="text-gray-600 text-xs">Selecciona <strong>"Agregar a pantalla de inicio"</strong></p>
        </div>
      </div>
    </div>
  )
}
