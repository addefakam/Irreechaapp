// Blocklist view — list of flagged visitors that trigger red alerts at gates

'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { getLocalBlocklist, type LocalBlocklistEntry } from '@/lib/idb'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ShieldAlert, AlertOctagon, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BlocklistView() {
  const { language } = useAppStore()
  const [entries, setEntries] = useState<LocalBlocklistEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try {
      // Pull from server first (if online) so we have fresh data
      if (navigator.onLine) {
        try {
          const res = await fetch('/api/blocklist')
          const data = await res.json()
          if (data?.entries) {
            setEntries(data.entries)
            return
          }
        } catch {
          // fall back to local
        }
      }
      const local = await getLocalBlocklist()
      setEntries(local)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-oromo-cream">
        <Loader2 className="h-8 w-8 animate-spin text-oromo-green" />
      </div>
    )
  }

  const high = entries.filter((e) => e.severity === 'HIGH')
  const medium = entries.filter((e) => e.severity === 'MEDIUM')
  const low = entries.filter((e) => e.severity === 'LOW')

  return (
    <div className="flex flex-1 flex-col gap-4 bg-oromo-cream p-4">
      <div>
        <h2 className="text-xl font-bold text-oromo-green-dark">
          {t(language, 'blocklistTitle')}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t(language, 'blocklistSubtitle')}
        </p>
      </div>

      {entries.length === 0 ? (
        <Card className="border-oromo-yellow/40 bg-white">
          <CardContent className="py-8 text-center">
            <ShieldAlert className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t(language, 'blocklistEmpty')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {high.length > 0 && (
            <SeveritySection
              title={t(language, 'high')}
              icon={<AlertOctagon className="h-5 w-5" />}
              color="text-red-700"
              entries={high}
            />
          )}
          {medium.length > 0 && (
            <SeveritySection
              title={t(language, 'medium')}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="text-amber-700"
              entries={medium}
            />
          )}
          {low.length > 0 && (
            <SeveritySection
              title={t(language, 'low')}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="text-blue-700"
              entries={low}
            />
          )}
        </>
      )}
    </div>
  )
}

function SeveritySection({
  title,
  icon,
  color,
  entries,
}: {
  title: string
  icon: React.ReactNode
  color: string
  entries: LocalBlocklistEntry[]
}) {
  const { language } = useAppStore()
  return (
    <div>
      <h3 className={cn('mb-2 flex items-center gap-2 text-sm font-bold', color)}>
        {icon}
        {title} ({entries.length})
      </h3>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li
            key={e.visitorId}
            className="rounded-lg border border-red-200 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                  {e.visitorName ?? e.visitorId}
                </div>
                <div className="truncate font-mono text-xs text-muted-foreground">
                  {e.visitorId}
                </div>
                <p className="mt-1 text-sm text-foreground">
                  {e.reason}
                </p>
              </div>
              <Badge
                variant="destructive"
                className={cn(
                  'text-[10px] uppercase flex-shrink-0',
                  e.severity === 'MEDIUM' && 'bg-amber-500 text-white hover:bg-amber-600',
                  e.severity === 'LOW' && 'bg-blue-500 text-white hover:bg-blue-600',
                )}
              >
                {e.severity}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
