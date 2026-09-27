// Gate dashboard — simplified: today's count + recent scans list (no analytics)

'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { getAllLocalScans, type LocalScan } from '@/lib/idb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DashboardView() {
  const { language, session } = useAppStore()
  const [scans, setScans] = useState<LocalScan[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try {
      const all = await getAllLocalScans(200)
      setScans(all)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('gate-guard:scan-saved', handler)
    return () => window.removeEventListener('gate-guard:scan-saved', handler)
  }, [])

  // Filter to today + this gate
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startISO = startOfToday.toISOString()

  const myTodayScans = scans
    .filter((s) => s.scannedAt >= startISO)
    .filter((s) => (session ? s.gateId === session.gateId : true))

  const recent = myTodayScans.slice(0, 20)

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-oromo-cream">
        <p className="text-sm text-muted-foreground">{t(language, 'loading')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 bg-oromo-cream p-4">
      <div>
        <h2 className="text-xl font-bold text-oromo-green-dark">
          {t(language, 'dashboardTitle')}
        </h2>
        {session && (
          <p className="text-sm text-muted-foreground">
            {language === 'or' ? session.gateNameOr : session.gateNameEn} · PIN {session.operatorPin}
          </p>
        )}
      </div>

      {/* Big today count */}
      <Card className="border-oromo-yellow/40 bg-white">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-oromo-green/10 text-oromo-green">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <div className="text-4xl font-bold tabular-nums text-oromo-green-dark">
              {myTodayScans.length}
            </div>
            <p className="text-sm text-muted-foreground">
              {t(language, 'todayCount')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent scans */}
      <Card className="border-oromo-yellow/40 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t(language, 'recentScans')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t(language, 'noRecentScans')}
            </p>
          ) : (
            <ul className="divide-y divide-border max-h-[60vh] overflow-y-auto">
              {recent.map((s) => (
                <li key={s.localId} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {s.visitorName ?? 'Unknown'}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">
                        {s.visitorId.length > 12
                          ? `${s.visitorId.slice(0, 6)}...${s.visitorId.slice(-4)}`
                          : s.visitorId}
                      </span>
                      {' · '}
                      {new Date(s.scannedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                        s.status === 'SCANNED' || s.status === 'ADMITTED'
                          ? 'bg-oromo-green/10 text-oromo-green-dark'
                          : 'bg-amber-50 text-amber-700',
                      )}
                    >
                      <Check className="h-2.5 w-2.5" />
                      {s.status}
                    </span>
                    {!s.synced && (
                      <span
                        className="h-2 w-2 rounded-full bg-amber-500"
                        title="Pending sync"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
