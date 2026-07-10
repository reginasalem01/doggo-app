'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS]         = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null)
  const [dismissed, setDismissed]     = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (sessionStorage.getItem('installDismissed')) return

    const isIOS    = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)

    if (isIOS && isSafari) { setShowIOS(true); return }

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

  // ── ANDROID / CHROME ──────────────────────────────────────────────────────
  if (showAndroid) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[420px] z-[999]
                      bg-doggo-dark rounded-2xl shadow-2xl px-4 py-4 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="Doggo" className="w-14 h-14 rounded-2xl shrink-0 shadow-md" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-base leading-tight">¡Descarga la app!</p>
          <p className="text-white/60 text-xs mt-0.5">Sin App Store · en tu pantalla de inicio</p>
        </div>
        <button
          onClick={install}
          className="bg-doggo-yellow text-doggo-dark font-black text-sm px-4 py-2.5 rounded-xl shrink-0"
        >
          Instalar
        </button>
        <button onClick={dismiss} className="text-white/30 text-2xl leading-none shrink-0 pl-1">×</button>
      </div>
    )
  }

  // ── iOS / SAFARI ──────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[420px] z-[999]
                    bg-doggo-dark rounded-2xl shadow-2xl px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="Doggo" className="w-14 h-14 rounded-2xl shrink-0 shadow-md" />
          <div>
            <p className="text-white font-black text-base leading-tight">¡Descarga la app!</p>
            <p className="text-white/60 text-xs mt-0.5">Sin App Store · gratis</p>
          </div>
        </div>
        <button onClick={dismiss} className="text-white/30 text-2xl leading-none pl-2">×</button>
      </div>

      {/* Pasos */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2.5">
          <span className="text-2xl shrink-0">📤</span>
          <p className="text-white text-sm">
            Toca <strong className="text-doggo-yellow">Compartir</strong> en Safari
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2.5">
          <span className="text-2xl shrink-0">➕</span>
          <p className="text-white text-sm">
            Selecciona <strong className="text-doggo-yellow">"Agregar a inicio"</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
