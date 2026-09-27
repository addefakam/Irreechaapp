// Irreecha GateGuard — QR Scanner Hook
// Uses the live camera stream and jsQR to decode QR codes from frames.
// Designed to work on Android Chrome (the primary target device).

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

export type ScanStatus = 'idle' | 'starting' | 'scanning' | 'error' | 'denied'

export type QRPayload = {
  raw: string
  parsed?: {
    format: 'ETH-ID'
    idNumber: string
    fullName: string
    dateOfBirth: string
    gender: string
    region: string
    issuedAt: string
  }
}

export function parseEthiopianQR(raw: string): QRPayload {
  const parts = raw.split('|')
  if (parts.length >= 7 && parts[0] === 'ETH-ID') {
    return {
      raw,
      parsed: {
        format: 'ETH-ID',
        idNumber: parts[1].trim(),
        fullName: parts[2].trim(),
        dateOfBirth: parts[3].trim(),
        gender: parts[4].trim(),
        region: parts[5].trim(),
        issuedAt: parts[6].trim(),
      },
    }
  }
  return { raw }
}

export function useQrScanner(opts: {
  onScan: (payload: QRPayload) => void
  active: boolean
}) {
  const { onScan, active } = opts
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastScanRef = useRef<{ raw: string; ts: number } | null>(null)
  const onScanRef = useRef(onScan)
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  // The scan loop lives inside this effect, so it has access to a stable
  // local function reference. The recursive rAF call is therefore safe.
  useEffect(() => {
    if (!active) return
    let cancelled = false
    let rafId: number | null = null

    async function startCamera() {
      setStatus('starting')
      setErrorMessage('')
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setStatus('error')
          setErrorMessage('Camera API not supported on this device.')
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        if (cancelled) return
        setStatus('scanning')
        rafId = requestAnimationFrame(loop)
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string }
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setStatus('denied')
          setErrorMessage('Camera permission denied. Enable it in browser settings.')
        } else if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
          setStatus('error')
          setErrorMessage('No camera found on this device.')
        } else {
          setStatus('error')
          setErrorMessage(err?.message ?? 'Failed to start camera.')
        }
      }
    }

    function loop() {
      if (cancelled) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth
        const h = video.videoHeight
        if (w > 0 && h > 0) {
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h)
            const imageData = ctx.getImageData(0, 0, w, h)
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            })
            if (code && code.data) {
              const now = Date.now()
              const last = lastScanRef.current
              if (!(last && last.raw === code.data && now - last.ts < 2500)) {
                lastScanRef.current = { raw: code.data, ts: now }
                onScanRef.current(parseEthiopianQR(code.data))
              }
            }
          }
        }
      }
      rafId = requestAnimationFrame(loop)
    }

    void startCamera()

    return () => {
      cancelled = true
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setStatus('idle')
    }
  }, [active])

  const manualStop = useCallback(() => {
    // Re-trigger the effect by toggling `active` from outside
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus('idle')
  }, [])

  return {
    videoRef,
    canvasRef,
    status,
    errorMessage,
    start: () => {
      // Start is triggered by the `active` prop going true (handled by effect).
      // This is a no-op stub for backward compat with the original API surface.
    },
    stop: manualStop,
  }
}
