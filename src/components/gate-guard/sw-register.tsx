// Service Worker registration component — mounts on the client

'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production' && !window.location.hostname.includes('space-z.ai')) {
      // Only register in production or on the preview domain to avoid dev confusion
      return
    }
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent — SW is a progressive enhancement
      })
    }
    if (document.readyState === 'complete') {
      onLoad()
    } else {
      window.addEventListener('load', onLoad)
      return () => window.removeEventListener('load', onLoad)
    }
  }, [])
  return null
}
