'use client'

import { useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
}

export default function ImageUpload({ value, onChange, folder = 'misc', label = 'Imagen' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)

    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()

    if (!res.ok || json.error) {
      setError(json.error ?? 'Error al subir imagen')
    } else {
      onChange(json.url)
    }
    setUploading(false)
    // Reset input so el mismo archivo se puede volver a subir si quieren
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label className="text-gray-500 text-xs uppercase tracking-wide block mb-2">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {value ? (
        <div className="relative">
          <img src={value} alt="preview" className="w-full h-40 object-cover rounded-xl" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm"
          >
            {uploading ? 'Subiendo...' : 'Cambiar foto'}
          </button>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-doggo-yellow hover:text-doggo-dark transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <>
              <span className="text-2xl animate-spin">⏳</span>
              <span className="text-xs font-medium">Subiendo...</span>
            </>
          ) : (
            <>
              <span className="text-3xl">📷</span>
              <span className="text-xs font-medium">Toca para subir foto</span>
              <span className="text-[10px]">JPG, PNG, WEBP</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  )
}
