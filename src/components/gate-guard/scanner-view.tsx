// Scanner view — FAST: scan QR → parse data → save locally → toast → continue
// No server round-trips, no blocklist lookup, no re-entry check. Just capture and store.

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { useQrScanner, parseEthiopianQR, type QRPayload } from '@/lib/qr'
import { saveScanLocal, type LocalScan } from '@/lib/idb'
import { toast } from 'sonner'
import { Camera, CameraOff, Keyboard, Loader2, RefreshCw, Check, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { v4 as uuidv4 } from 'uuid'

export function ScannerView() {
  const { language, session } = useAppStore()
  const [cameraActive, setCameraActive] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualId, setManualId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<{ name: string; ts: number } | null>(null)

  // Fast save handler — runs instantly, no network
  const handlePayload = useCallback(
    async (payload: QRPayload) => {
      if (!session) return
      setSubmitting(true)
      try {
        const idNumber = payload.parsed?.idNumber ?? payload.raw
        const fullName = payload.parsed?.fullName ?? 'Unknown'

        const localScan: LocalScan = {
          localId: uuidv4(),
          visitorId: idNumber,
          visitorName: fullName,
          gateId: session.gateId,
          gateCode: session.gateCode,
          operatorPin: session.operatorPin,
          status: 'SCANNED',
          reason: null,
          scannedAt: new Date().toISOString(),
          synced: 0,
          syncedAt: null,
          payload: payload.raw,
        }
        await saveScanLocal(localScan)

        // Notify sync bar
        window.dispatchEvent(new CustomEvent('gate-guard:scan-saved'))

        setLastSaved({ name: fullName, ts: Date.now() })
        toast.success(t(language, 'scanned'), {
          description: fullName,
          duration: 1500,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [session, language],
  )

  const { videoRef, canvasRef, status, errorMessage } = useQrScanner({
    onScan: handlePayload,
    active: cameraActive,
  })

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = manualId.replace(/\D/g, '')
    if (trimmed.length < 1) return
    // Build a minimal payload — manual entry means we only have the ID number
    const payload: QRPayload = {
      raw: trimmed,
      parsed: {
        format: 'ETH-ID',
        idNumber: trimmed,
        fullName: 'Manual Entry',
        dateOfBirth: '',
        gender: '',
        region: '',
        issuedAt: '',
      },
    }
    setManualId('')
    void handlePayload(payload)
  }

  return (
    <div className="flex flex-1 flex-col bg-black">
      <div className="bg-oromo-green-dark px-4 py-3 text-center text-white">
        <h2 className="text-base font-semibold">{t(language, 'scannerTitle')}</h2>
        <p className="text-xs text-white/80">{t(language, 'scannerSubtitle')}</p>
      </div>

      {/* Last-saved confirmation strip (instant feedback) */}
      {lastSaved && (
        <div className="flex items-center gap-2 bg-oromo-green px-3 py-1.5 text-white text-xs animate-in fade-in slide-in-from-top">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {lastSaved.name}
          </span>
          <span className="ml-auto font-mono opacity-70">
            {new Date(lastSaved.ts).toLocaleTimeString()}
          </span>
        </div>
      )}

      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
        {manualMode ? (
          <ManualEntryCard
            value={manualId}
            onChange={setManualId}
            onSubmit={handleManualSubmit}
            submitting={submitting}
            onBackToCamera={() => setManualMode(false)}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover ${
                cameraActive && status === 'scanning' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!cameraActive && (
              <IdleOverlay
                status={status}
                onStart={() => setCameraActive(true)}
              />
            )}

            {cameraActive && status === 'scanning' && <ScanningOverlay />}

            {cameraActive && status !== 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                {status === 'starting' ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin text-oromo-yellow" />
                    <p className="mt-3 text-sm">{t(language, 'cameraStarting')}</p>
                  </>
                ) : (
                  <>
                    <CameraOff className="h-12 w-12 text-red-400" />
                    <p className="mt-3 max-w-xs px-6 text-center text-sm text-red-200">
                      {errorMessage}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCameraActive(false)}
                        className="border-white/30 text-white"
                      >
                        {t(language, 'cancel')}
                      </Button>
                      <Button
                        onClick={() => {
                          setCameraActive(false)
                          setTimeout(() => setCameraActive(true), 100)
                        }}
                        className="bg-oromo-green text-white"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t(language, 'retry')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {cameraActive && status === 'scanning' && (
              <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4">
                <Button
                  variant="outline"
                  onClick={() => setCameraActive(false)}
                  className="border-white/30 bg-black/40 text-white hover:bg-black/60"
                >
                  <CameraOff className="mr-2 h-4 w-4" />
                  {t(language, 'stopCamera')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCameraActive(false)
                    setManualMode(true)
                  }}
                  className="border-white/30 bg-black/40 text-white hover:bg-black/60"
                >
                  <Keyboard className="mr-2 h-4 w-4" />
                  {t(language, 'manualEntry')}
                </Button>
              </div>
            )}

            {!cameraActive && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setManualMode(true)}
                  className="border-oromo-green/30 bg-white/90 text-oromo-green hover:bg-white"
                >
                  <Keyboard className="mr-2 h-4 w-4" />
                  {t(language, 'manualEntry')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function IdleOverlay({
  status,
  onStart,
}: {
  status: string
  onStart: () => void
}) {
  const { language } = useAppStore()
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 text-center text-white">
      <Camera className="h-20 w-20 text-oromo-yellow" strokeWidth={1.5} />
      <p className="max-w-xs text-sm text-white/80">
        {t(language, 'scannerSubtitle')}
      </p>
      <Button
        onClick={onStart}
        size="lg"
        className="bg-oromo-green px-8 py-6 text-base text-white hover:bg-oromo-green-dark"
      >
        <Camera className="mr-2 h-5 w-5" />
        {t(language, 'startCamera')}
      </Button>
    </div>
  )
}

function ScanningOverlay() {
  const { language } = useAppStore()
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6">
      <div className="relative aspect-square w-3/4 max-w-sm">
        <div className="absolute inset-0 rounded-2xl border-2 border-white/30" />
        <div className="absolute -top-1 -left-1 h-10 w-10 rounded-tl-2xl border-t-4 border-l-4 border-oromo-yellow" />
        <div className="absolute -top-1 -right-1 h-10 w-10 rounded-tr-2xl border-t-4 border-r-4 border-oromo-yellow" />
        <div className="absolute -bottom-1 -left-1 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-oromo-yellow" />
        <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-oromo-yellow" />
        <div className="absolute left-1/2 top-1/2 h-0.5 w-2/3 -translate-x-1/2 -translate-y-1/2 animate-pulse bg-oromo-yellow/70 rounded-full" />
      </div>
      <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs text-white/90 backdrop-blur-sm">
        <UserPlus className="h-3.5 w-3.5" />
        {t(language, 'readyToScan')}
      </div>
    </div>
  )
}

function ManualEntryCard({
  value,
  onChange,
  onSubmit,
  submitting,
  onBackToCamera,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  onBackToCamera: () => void
}) {
  const { language } = useAppStore()
  return (
    <div className="w-full max-w-md px-4">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-oromo-yellow/40 bg-white p-6 shadow-xl"
      >
        <h3 className="mb-2 text-lg font-bold text-oromo-green-dark">
          {t(language, 'manualEntry')}
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          {t(language, 'manualEntryHint')}
        </p>
        <div className="space-y-2">
          <Label htmlFor="manualId" className="text-sm font-medium">
            {t(language, 'enterIdNumber')}
          </Label>
          <Input
            id="manualId"
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 16))}
            placeholder="1234..."
            className="bg-white font-mono text-lg"
            autoComplete="off"
            autoFocus
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBackToCamera}
            className="flex-1"
          >
            {t(language, 'back')}
          </Button>
          <Button
            type="submit"
            disabled={submitting || value.length < 1}
            className="flex-1 bg-oromo-green text-white hover:bg-oromo-green-dark"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t(language, 'submitManual')
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
