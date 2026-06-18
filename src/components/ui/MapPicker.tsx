'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number, address: string) => void
}

// Centro por defecto: Guayaquil
const DEFAULT_LAT = -2.1894
const DEFAULT_LNG = -79.8891

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'es' } }
    )
    const data = await res.json()
    return data.display_name ?? ''
  } catch {
    return ''
  }
}

export default function MapPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef      = useRef<{ remove: () => void; setView: (c: [number,number], z: number) => void } | null>(null)
  const markerRef   = useRef<{ setLatLng: (c: [number,number]) => void; getLatLng: () => { lat: number; lng: number } } | null>(null)
  const [locating, setLocating]   = useState(false)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current || mapRef.current) return

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id   = 'leaflet-css'
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const initLat = lat ?? DEFAULT_LAT
    const initLng = lng ?? DEFAULT_LNG

    import('leaflet').then((L) => {
      // Fix default marker icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!).setView([initLat, initLng], 16)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map)

      async function applyMove(newLat: number, newLng: number) {
        marker.setLatLng([newLat, newLng])
        const addr = await reverseGeocode(newLat, newLng)
        onChange(newLat, newLng, addr)
      }

      marker.on('dragend', () => {
        const p = marker.getLatLng()
        applyMove(p.lat, p.lng)
      })

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        applyMove(e.latlng.lat, e.latlng.lng)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mapRef.current    = map as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      markerRef.current = marker as any

      // Si no había coordenada previa, emite la posición default
      if (lat === null) applyMove(initLat, initLng)
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current    = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: la, longitude: lo } = pos.coords
        mapRef.current?.setView([la, lo], 17)
        markerRef.current?.setLatLng([la, lo])
        const addr = await reverseGeocode(la, lo)
        onChange(la, lo, addr)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  if (!mounted) {
    return <div className="w-full h-52 bg-gray-100 rounded-xl animate-pulse" />
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="w-full bg-gray-100 text-doggo-red font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        {locating ? '📍 Obteniendo ubicación…' : '📍 Usar mi ubicación actual'}
      </button>

      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-gray-200"
        style={{ height: '210px', zIndex: 0 }}
      />

      <p className="text-gray-500 text-xs text-center">
        Toca el mapa o arrastra el pin para ajustar tu ubicación
      </p>
    </div>
  )
}
