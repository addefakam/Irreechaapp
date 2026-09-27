// Analytics view — heatmaps and arrival charts for future Irreecha planning

'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, TrendingUp, MapPin, Clock, BarChart3 } from 'lucide-react'

type AnalyticsData = {
  day: string
  dayOffset: number
  hours: { hour: number; count: number; admitted: number; blocked: number }[]
  perGate: {
    gateId: string
    gateCode: string
    gateNameEn: string
    gateNameOr: string
    count: number
    admitted: number
    blocked: number
    capacity: number
  }[]
  dayOverDay: { date: string; count: number; admitted: number; blocked: number }[]
  busiestHour: number
  busiestGate: string
  totalArrivals: number
  totalAdmitted: number
  totalBlocked: number
}

export function AnalyticsView() {
  const { language } = useAppStore()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [dayOffset, setDayOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/analytics?day=${dayOffset}`)
        const json = await res.json()
        setData(json)
      } finally {
        setLoading(false)
      }
    })()
  }, [dayOffset])

  if (loading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center bg-oromo-cream">
        <Loader2 className="h-8 w-8 animate-spin text-oromo-green" />
      </div>
    )
  }

  const hourData = data.hours.map((h) => ({
    hour: `${h.hour}:00`,
    arrivals: h.count,
    admitted: h.admitted,
    blocked: h.blocked,
  }))

  const gateData = data.perGate.map((g) => ({
    code: g.gateCode,
    name: language === 'or' ? g.gateNameOr : g.gateNameEn,
    arrivals: g.count,
    admitted: g.admitted,
    blocked: g.blocked,
    capacity: g.capacity,
  }))

  const dayData = data.dayOverDay.map((d) => ({
    date: d.date.slice(5),
    total: d.count,
    admitted: d.admitted,
    blocked: d.blocked,
  }))

  return (
    <div className="flex flex-1 flex-col gap-4 bg-oromo-cream p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-oromo-green-dark">
            {t(language, 'analyticsTitle')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t(language, 'analyticsSubtitle')}
          </p>
        </div>
        <Select value={String(dayOffset)} onValueChange={(v) => setDayOffset(parseInt(v, 10))}>
          <SelectTrigger className="w-36 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t(language, 'today')}</SelectItem>
            <SelectItem value="1">{t(language, 'yesterday')}</SelectItem>
            <SelectItem value="2">{t(language, 'dayMinus2')}</SelectItem>
            <SelectItem value="3">{t(language, 'dayMinus3')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryStat
          icon={<TrendingUp className="h-5 w-5" />}
          label={t(language, 'totalArrivals')}
          value={data.totalArrivals}
          color="bg-oromo-green/10 text-oromo-green-dark"
        />
        <SummaryStat
          icon={<Clock className="h-5 w-5" />}
          label={t(language, 'busiestHour')}
          value={`${data.busiestHour}:00`}
          color="bg-amber-50 text-amber-700"
        />
        <SummaryStat
          icon={<MapPin className="h-5 w-5" />}
          label={t(language, 'busiestGate')}
          value={data.busiestGate || '—'}
          color="bg-red-50 text-red-700"
        />
      </div>

      {/* Arrivals by hour */}
      <Card className="border-oromo-yellow/40 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-oromo-green" />
            {t(language, 'arrivalsByHour')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="admitted"
                  name={t(language, 'admittedToday')}
                  stackId="a"
                  fill="#1B7A3D"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="blocked"
                  name={t(language, 'blockedToday')}
                  stackId="a"
                  fill="#D8232A"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Arrivals by gate */}
      <Card className="border-oromo-yellow/40 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-oromo-green" />
            {t(language, 'arrivalsByGate')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={gateData}
                layout="vertical"
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis
                  type="category"
                  dataKey="code"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="arrivals" name={t(language, 'arrivals')} radius={[0, 4, 4, 0]}>
                  {gateData.map((g, i) => (
                    <Cell
                      key={i}
                      fill={
                        i === 0 ? '#1B7A3D' :
                        i === 1 ? '#2A9D4F' :
                        i === 2 ? '#F2B705' :
                        i === 3 ? '#E67E22' :
                        '#D8232A'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Day-over-day */}
      <Card className="border-oromo-yellow/40 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-oromo-green" />
            {t(language, 'dayOverDay')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dayData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="admitted"
                  name={t(language, 'admittedToday')}
                  stroke="#1B7A3D"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="blocked"
                  name={t(language, 'blockedToday')}
                  stroke="#D8232A"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className={`rounded-xl border border-transparent p-3 ${color}`}>
      <div className="flex items-center justify-between">
        {icon}
      </div>
      <div className="mt-1 text-lg font-bold tabular-nums">{value}</div>
      <p className="text-[11px] font-medium opacity-90 leading-tight">{label}</p>
    </div>
  )
}
