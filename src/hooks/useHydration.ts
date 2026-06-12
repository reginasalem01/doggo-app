import { useEffect, useState } from 'react'

/**
 * Returns true only after the client has hydrated.
 * Use this to avoid SSR/localStorage mismatches in Zustand persist stores.
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
