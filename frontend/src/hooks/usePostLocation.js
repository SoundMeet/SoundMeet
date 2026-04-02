import { useState } from 'react'

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY

/**
 * usePostLocation — optional geolocation capture for post creation.
 *
 * Captures the user's current position via the browser Geolocation API,
 * then reverse-geocodes it via MapTiler to get a human-readable place name.
 *
 * NOT called automatically — user opts in by tapping "Add location".
 *
 * Returns:
 *   location      { lat: number, lng: number, name: string } | null
 *   status        'idle' | 'requesting' | 'granted' | 'denied' | 'error'
 *   requestLocation  () => void  — triggers permission prompt + fetch
 *   clearLocation    () => void  — resets to null / idle
 *
 * Backend guide:
 *   Store as three nullable columns on the posts table:
 *     post_lat         FLOAT  — raw latitude
 *     post_lng         FLOAT  — raw longitude
 *     post_place_name  TEXT   — human-readable name (neighbourhood / city)
 *   This enables future geo-queries like "posts near me" without re-migration.
 *   Do NOT store place name as the sole location — always persist lat/lng too.
 */
export function usePostLocation() {
  const [location, setLocation] = useState(null)
  const [status,   setStatus]   = useState('idle')

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      return
    }
    setStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        // Fallback display if reverse geocode fails
        let name = `${lat.toFixed(3)}, ${lng.toFixed(3)}`

        try {
          const res = await fetch(
            `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}&language=en`
          )
          if (res.ok) {
            const data = await res.json()
            const feature = data.features?.[0]
            if (feature) {
              // Prefer the shortest useful label: text (neighbourhood/city) over full place_name
              name = feature.text ?? feature.place_name ?? name
            }
          }
        } catch {
          // Silently fall back to raw coords
        }

        setLocation({ lat, lng, name })
        setStatus('granted')
      },
      () => {
        setStatus('denied')
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }

  const clearLocation = () => {
    setLocation(null)
    setStatus('idle')
  }

  return { location, status, requestLocation, clearLocation }
}
