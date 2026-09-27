// Sync status bar — compact strip showing today's count + online/offline + pending sync.
// Listens for the custom 'gate-guard:scan-saved' event and triggers a background sync.

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { getPendingScans, markScanSynced, getAllLocalScans } from '@/lib/idb'
import { CloudOff, Cloud, RefreshCw, Check, Loader2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type SyncResultState = 'idle' | 'syncing' | 'success' | 'failed'

export function SyncStatusBar() {
  const {
    language,
    session,
    sync,
    setOnline,
    setLastSyncAt,
    setPendingCount,
    setSyncing,
  } = useAppStore()
  const [resultState, setResultState] = useState<SyncResultState>('idle')
  const [todayCount, setTodayCount] = useState(0)

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

  // Refresh pending count + today's count
  const refreshCounts = useCallback(async () => {
    try {
      const pending = await getPendingScans()
      setPendingCount(pending.length)
      // Today's scans for this gate
      const all = await getAllLocalScans(500)
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const startISO = startOfToday.toISOString()
      const today = all.filter(
        (s) => s.scannedAt >= startISO && (!session || s.gateId === session.gateId),
      )
      setTodayCount(today.length)
    } catch {
      // ignore
    }
  }, [setPendingCount, session])

  useEffect(() => {
    refreshCounts()
    const handler = () => refreshCounts()
    window.addEventListener('gate-guard:scan-saved', handler)
    return () => window.removeEventListener('gate-guard:scan-saved', handler)
  }, [refreshCounts])

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
    <div className={cn('border-b px-3 py-1.5', bg)}>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-sm">
        {/* Left: today's count badge */}
        <div className="flex items-center gap-1.5 font-semibold">
          <Users className="h-4 w-4" />
          <span className="tabular-nums text-base">{todayCount}</span>
          <span className="text-xs font-normal opacity-80">
            {t(language, 'todayCount')}
          </span>
        </div>

        {/* Right: sync status + button */}
        <div className="flex items-center gap-2 text-xs">
          {!sync.online ? (
            <span className="flex items-center gap-1">
              <CloudOff className="h-3.5 w-3.5" />
              {t(language, 'offline')}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              {resultState === 'success' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {t(language, 'syncSuccess')}
                </>
              ) : resultState === 'failed' ? (
                t(language, 'syncFailed')
              ) : sync.pendingCount > 0 ? (
                <>
                  <Cloud className="h-3.5 w-3.5" />
                  {t(language, 'pendingScans', { count: sync.pendingCount })}
                </>
              ) : (
                <span className="flex items-center gap-1 opacity-70">
                  <Cloud className="h-3.5 w-3.5" />
                  {sync.lastSyncAt
                    ? new Date(sync.lastSyncAt).toLocaleTimeString()
                    : t(language, 'syncStatusOnline')}
                </span>
              )}
            </span>
          )}
          {sync.online && sync.pendingCount > 0 && (
            <button
              onClick={handleSyncClick}
              disabled={sync.syncing}
              className="flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium border border-current/30 hover:bg-white/80 disabled:opacity-50"
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
