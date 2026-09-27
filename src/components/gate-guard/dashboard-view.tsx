// Gate dashboard — today's count for this operator's gate

'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { getAllLocalScans, type LocalScan } from '@/lib/idb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Users, CheckCircle2, XOctagon, AlertTriangle, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

const GATE_CAPACITIES: Record<string, number> = {
  HORARSADI: 3000,
  BISH_N: 1500,
  BISH_S: 1500,
  BISH_E: 1200,
  BISH_W: 1200,
}

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
    .filter((s) => session ? s.gateId === session.gateId : true)

  const admitted = myTodayScans.filter((s) => s.status === 'ADMITTED').length
  const blocked = myTodayScans.filter((s) => s.status === 'BLOCKED').length
  const reentry = myTodayScans.filter((s) => s.status === 'REENTRY_WARN').length

  const capacity = session ? GATE_CAPACITIES[session.gateCode] ?? 1500 : 1500
  const capacityPct = Math.min(100, Math.round((admitted / capacity) * 100))

  const recent = myTodayScans.slice(0, 10)

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

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label={t(language, 'todayCount')}
          value={myTodayScans.length}
          color="bg-oromo-green/10 text-oromo-green"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label={t(language, 'admittedToday')}
          value={admitted}
          color="bg-green-50 text-green-700"
        />
        <StatCard
          icon={<XOctagon className="h-5 w-5" />}
          label={t(language, 'blockedToday')}
          value={blocked}
          color="bg-red-50 text-red-700"
        />
      </div>

      {/* Capacity */}
      <Card className="border-oromo-yellow/40 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-oromo-green" />
              {t(language, 'capacityUsed')}
            </span>
            <span className="text-muted-foreground">
              {admitted} / {capacity}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress
            value={capacityPct}
            className="h-3 bg-muted"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{capacityPct}%</span>
            {reentry > 0 && (
              <span className="flex items-center gap-1 text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                {reentry} {t(language, 'reentryWarn')}
              </span>
            )}
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
            <ul className="divide-y divide-border">
              {recent.map((s) => (
                <li key={s.localId} className="flex items-center justify-between py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {s.visitorName ?? 'Unknown'}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{s.visitorId.slice(0, 6)}...</span>{' '}
                      · {new Date(s.scannedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    {!s.synced && (
                      <span className="text-xs text-amber-600" title="Pending sync">
                        ●
                      </span>
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

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className={cn('rounded-xl border border-transparent p-3', color)}>
      <div className="flex items-center justify-between">
        {icon}
        <span className="text-2xl font-bold tabular-nums">{value}</span>
      </div>
      <p className="mt-1 text-[11px] font-medium leading-tight opacity-90">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: LocalScan['status'] }) {
  const { language } = useAppStore()
  const variant =
    status === 'ADMITTED'
      ? 'default'
      : status === 'BLOCKED'
        ? 'destructive'
        : 'secondary'
  const label =
    status === 'ADMITTED'
      ? t(language, 'admitted')
      : status === 'BLOCKED'
        ? t(language, 'blocked')
        : status === 'REENTRY_WARN'
          ? t(language, 'reentryWarn')
          : t(language, 'visitorNotFound')
  return (
    <Badge variant={variant} className={cn(
      'text-[10px] uppercase',
      status === 'ADMITTED' && 'bg-oromo-green text-white hover:bg-oromo-green',
      status === 'REENTRY_WARN' && 'bg-amber-500 text-white hover:bg-amber-600',
    )}>
      {label}
    </Badge>
  )
}
