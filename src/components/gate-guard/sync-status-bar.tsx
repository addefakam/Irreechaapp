// Sync status bar — shows online/offline state, pending count, sync-now button.

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { getPendingScans, markScanSynced } from '@/lib/idb'
import { CloudOff, Cloud, RefreshCw, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type SyncResultState = 'idle' | 'syncing' | 'success' | 'failed'

export function SyncStatusBar() {
  const {
    language,
    sync,
    setOnline,
    setLastSyncAt,
    setPendingCount,
    setSyncing,
  } = useAppStore()
  const [resultState, setResultState] = useState<SyncResultState>('idle')

  // Online/offline events
  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    setOnline(navigator.onLine)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [setOnline])

  // Refresh pending count
  const refreshPending = useCallback(async () => {
    try {
      const pending = await getPendingScans()
      setPendingCount(pending.length)
    } catch {
      // ignore
    }
  }, [setPendingCount])

  useEffect(() => {
    refreshPending()
    const handler = () => refreshPending()
    window.addEventListener('gate-guard:scan-saved', handler)
    return () => window.removeEventListener('gate-guard:scan-saved', handler)
  }, [refreshPending])

  // Keep latest deps in refs so we can have a stable doSync identity
  const syncRef = useRef(sync)
  useEffect(() => {
    syncRef.current = sync
  }, [sync])

  const doSync = useCallback(async () => {
    if (!navigator.onLine) return
    setSyncing(true)
    setResultState('syncing')
    try {
      const pending = await getPendingScans()
      if (pending.length === 0) {
        setResultState('idle')
        return
      }
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scans: pending,
          device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
        }),
      })
      if (!res.ok) throw new Error('Sync failed')
      for (const s of pending) {
        await markScanSynced(s.localId)
      }
      const now = new Date().toISOString()
      setLastSyncAt(now)
      setPendingCount(0)
      setResultState('success')
      setTimeout(() => setResultState('idle'), 2000)
    } catch {
      setResultState('failed')
      setTimeout(() => setResultState('idle'), 3000)
    } finally {
      setSyncing(false)
    }
  }, [setSyncing, setLastSyncAt, setPendingCount])

  // Auto-sync trigger
  useEffect(() => {
    if (sync.online && sync.pendingCount > 0 && !sync.syncing) {
      void doSync()
    }
  }, [sync.online, sync.pendingCount, sync.syncing, doSync])

  const handleSyncClick = () => {
    if (sync.syncing) return
    void doSync()
  }

  const bg = !sync.online
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : sync.pendingCount > 0
      ? 'bg-blue-50 border-blue-200 text-blue-800'
      : 'bg-oromo-green/10 border-oromo-green/30 text-oromo-green-dark'

  return (
    <div className={cn('border-b px-4 py-2', bg)}>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          {!sync.online ? (
            <>
              <CloudOff className="h-4 w-4" />
              <span className="font-medium">{t(language, 'syncStatusOffline')}</span>
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4" />
              <span className="font-medium">{t(language, 'syncStatusOnline')}</span>
              {sync.pendingCount > 0 && (
                <span className="ml-1">
                  {t(language, 'pendingScans', { count: sync.pendingCount })}
                </span>
              )}
              {sync.lastSyncAt && (
                <span className="ml-1 text-xs opacity-70">
                  · {t(language, 'lastSync')}:{' '}
                  {new Date(sync.lastSyncAt).toLocaleTimeString()}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {resultState === 'success' && (
            <span className="flex items-center gap-1 text-oromo-green-dark">
              <Check className="h-4 w-4" />
              {t(language, 'syncSuccess')}
            </span>
          )}
          {resultState === 'failed' && (
            <span className="flex items-center gap-1 text-red-700">
              {t(language, 'syncFailed')}
            </span>
          )}
          {sync.online && sync.pendingCount > 0 && (
            <button
              onClick={handleSyncClick}
              disabled={sync.syncing}
              className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium border border-current/30 hover:bg-white/80 disabled:opacity-50"
            >
              {sync.syncing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              {sync.syncing ? t(language, 'syncing') : t(language, 'syncNow')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
