// Scanner view — live camera + QR decoding + visitor lookup + status modal

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { useQrScanner, parseEthiopianQR, type QRPayload } from '@/lib/qr'
import {
  cacheBlocklistEntries,
  cacheVisitor,
  checkRecentReentry,
  getLocalBlocklist,
  saveScanLocal,
  type LocalScan,
} from '@/lib/idb'
import { ScanResultModal } from './scan-result-modal'
import { Camera, CameraOff, Keyboard, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { v4 as uuidv4 } from 'uuid'

export type ScanOutcome = {
  status: 'ADMITTED' | 'BLOCKED' | 'REENTRY_WARN' | 'NOT_FOUND'
  visitor: {
    id: string
    fullName: string
    dateOfBirth: string
    gender: string
    region: string
    issuedAt: string
  } | null
  blocklist: { reason: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' } | null
  reentryScan: LocalScan | null
  rawPayload: string
}

function emptyOutcome(): ScanOutcome {
  return {
    status: 'NOT_FOUND',
    visitor: null,
    blocklist: null,
    reentryScan: null,
    rawPayload: '',
  }
}

export function ScannerView() {
  const { language, session } = useAppStore()
  const [cameraActive, setCameraActive] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualId, setManualId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)

  // First-load: refresh blocklist cache from server (when online)
  useEffect(() => {
    if (!navigator.onLine) return
    ;(async () => {
      try {
        const res = await fetch('/api/blocklist')
        const data = await res.json()
        if (data?.entries) {
          await cacheBlocklistEntries(
            data.entries.map((e: { visitorId: string; visitorName: string | null; reason: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }) => ({
              visitorId: e.visitorId,
              visitorName: e.visitorName,
              reason: e.reason,
              severity: e.severity,
              cachedAt: new Date().toISOString(),
            })),
          )
        }
      } catch {
        // ignore — offline mode uses cached blocklist
      }
    })()
  }, [])

  const handlePayload = useCallback(
    async (payload: QRPayload) => {
      if (!session) return
      setSubmitting(true)
      try {
        // Extract ID number from parsed payload, or fall back to raw
        const idNumber = payload.parsed?.idNumber ?? payload.raw
        const fullNameFromQR = payload.parsed?.fullName ?? null

        // 1. Check local blocklist first (instant — works offline)
        const localBlock = await getLocalBlocklist()
        const blockedEntry = localBlock.find((b) => b.visitorId === idNumber)

        // 2. Try to fetch full visitor record from server (when online)
        let visitor: ScanOutcome['visitor'] = null
        let serverBlocklist: ScanOutcome['blocklist'] = null
        if (navigator.onLine) {
          try {
            const res = await fetch(`/api/visitors/${encodeURIComponent(idNumber)}`)
            if (res.ok) {
              const data = await res.json()
              if (data.found && data.visitor) {
                visitor = data.visitor
                if (data.blocklist) {
                  serverBlocklist = data.blocklist
                }
              }
            }
          } catch {
            // network failure — fall back to QR data + local cache
          }
        }

        // Fallback: build minimal visitor record from QR data
        if (!visitor && payload.parsed) {
          visitor = {
            id: payload.parsed.idNumber,
            fullName: payload.parsed.fullName,
            dateOfBirth: payload.parsed.dateOfBirth,
            gender: payload.parsed.gender,
            region: payload.parsed.region,
            issuedAt: payload.parsed.issuedAt,
          }
        }

        // Cache visitor locally for offline re-use
        if (visitor) {
          await cacheVisitor({
            id: visitor.id,
            fullName: visitor.fullName,
            dateOfBirth: visitor.dateOfBirth,
            gender: visitor.gender,
            region: visitor.region,
            issuedAt: visitor.issuedAt,
            cachedAt: new Date().toISOString(),
          })
        }

        // Determine final blocklist status (prefer server, fall back to local)
        const finalBlocklist = serverBlocklist ?? (blockedEntry ? {
          reason: blockedEntry.reason,
          severity: blockedEntry.severity,
        } : null)

        // 3. Check re-entry (any scan within 4h for this visitor, by this gate)
        const reentry = await checkRecentReentry(idNumber, 4)

        // 4. Determine status
        let status: ScanOutcome['status']
        let reason: string | null = null
        if (finalBlocklist) {
          status = 'BLOCKED'
          reason = finalBlocklist.reason
        } else if (reentry) {
          status = 'REENTRY_WARN'
          reason = 'Re-entry within 4h'
        } else if (!visitor) {
          status = 'NOT_FOUND'
          reason = 'ID not in registry'
        } else {
          status = 'ADMITTED'
        }

        // 5. Save scan locally (always — offline-first)
        const localScan: LocalScan = {
          localId: uuidv4(),
          visitorId: idNumber,
          visitorName: visitor?.fullName ?? fullNameFromQR ?? 'Unknown',
          gateId: session.gateId,
          gateCode: session.gateCode,
          operatorPin: session.operatorPin,
          status,
          reason,
          scannedAt: new Date().toISOString(),
          synced: 0,
          syncedAt: null,
          payload: payload.raw,
        }
        await saveScanLocal(localScan)

        // 6. Trigger background sync attempt (will no-op if offline)
        // Use a custom event so the sync-status-bar can react
        window.dispatchEvent(new CustomEvent('gate-guard:scan-saved'))

        setOutcome({
          status,
          visitor,
          blocklist: finalBlocklist,
          reentryScan: reentry,
          rawPayload: payload.raw,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [session],
  )

  const { videoRef, canvasRef, status, errorMessage, start, stop } = useQrScanner({
    onScan: handlePayload,
    active: cameraActive,
  })

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = manualId.replace(/\D/g, '')
    if (trimmed.length < 1) return
    // Build a payload as if it was scanned
    const payload = parseEthiopianQR(trimmed)
    // If the manual entry isn't in ETH-ID format, we still need an ID number
    if (!payload.parsed) {
      // Build a minimal payload with just the ID number
      payload.parsed = {
        format: 'ETH-ID',
        idNumber: trimmed,
        fullName: 'Manual Entry',
        dateOfBirth: '',
        gender: '',
        region: '',
        issuedAt: '',
      }
    }
    setManualId('')
    handlePayload(payload)
  }

  return (
    <div className="flex flex-1 flex-col bg-black">
      <div className="bg-oromo-green-dark px-4 py-3 text-center text-white">
        <h2 className="text-base font-semibold">{t(language, 'scannerTitle')}</h2>
        <p className="text-xs text-white/80">{t(language, 'scannerSubtitle')}</p>
      </div>

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
            {/* Video element (always rendered so ref is stable) */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover ${
                cameraActive && status === 'scanning' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Idle / starting overlay */}
            {!cameraActive && (
              <IdleOverlay
                status={status}
                errorMessage={errorMessage}
                onStart={() => setCameraActive(true)}
              />
            )}

            {/* Scanning frame overlay */}
            {cameraActive && status === 'scanning' && (
              <ScanningOverlay />
            )}

            {/* Starting / error overlay */}
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
                        onClick={() => {
                          stop()
                          setCameraActive(false)
                        }}
                        className="border-white/30 text-white"
                      >
                        {t(language, 'cancel')}
                      </Button>
                      <Button
                        onClick={() => {
                          stop()
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

            {/* Bottom action bar */}
            {cameraActive && status === 'scanning' && (
              <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    stop()
                    setCameraActive(false)
                  }}
                  className="border-white/30 bg-black/40 text-white hover:bg-black/60"
                >
                  <CameraOff className="mr-2 h-4 w-4" />
                  {t(language, 'stopCamera')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    stop()
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

            {/* Manual entry toggle when idle */}
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

      {/* Outcome modal */}
      {outcome && (
        <ScanResultModal
          outcome={outcome}
          onClose={() => setOutcome(null)}
          onOverride={() => setOutcome(null)}
        />
      )}
    </div>
  )
}

function IdleOverlay({
  status,
  errorMessage,
  onStart,
}: {
  status: string
  errorMessage: string
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
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {/* Target frame */}
      <div className="relative aspect-square w-3/4 max-w-sm">
        <div className="absolute inset-0 rounded-2xl border-2 border-white/30" />
        {/* Corner markers */}
        <div className="absolute -top-1 -left-1 h-10 w-10 rounded-tl-2xl border-t-4 border-l-4 border-oromo-yellow" />
        <div className="absolute -top-1 -right-1 h-10 w-10 rounded-tr-2xl border-t-4 border-r-4 border-oromo-yellow" />
        <div className="absolute -bottom-1 -left-1 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-oromo-yellow" />
        <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-oromo-yellow" />
        {/* Pulsing center hint */}
        <div className="absolute left-1/2 top-1/2 h-0.5 w-2/3 -translate-x-1/2 -translate-y-1/2 animate-pulse bg-oromo-yellow/70 rounded-full" />
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
