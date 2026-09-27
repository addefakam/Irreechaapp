// Demo Card view — pick a visitor from the registry and display their QR code.
// Use this to test the scanner: open this view on one phone, scan it with another.

'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, QrCode, Search, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

type DemoVisitor = {
  id: string
  fullName: string
  dateOfBirth: string
  gender: string
  region: string
  blocked: boolean
}

export function DemoCardView() {
  const { language } = useAppStore()
  const [visitors, setVisitors] = useState<DemoVisitor[]>([])
  const [filtered, setFiltered] = useState<DemoVisitor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DemoVisitor | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/visitors?limit=30')
        const data = await res.json()
        setVisitors(data.visitors || [])
        setFiltered(data.visitors || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!search) {
      setFiltered(visitors)
      return
    }
    const q = search.toLowerCase()
    setFiltered(
      visitors.filter(
        (v) =>
          v.id.includes(q) ||
          v.fullName.toLowerCase().includes(q),
      ),
    )
  }, [search, visitors])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-oromo-cream">
        <Loader2 className="h-8 w-8 animate-spin text-oromo-green" />
      </div>
    )
  }

  if (selected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-oromo-cream p-4">
        <div className="w-full max-w-sm">
          {/* Demo ID card */}
          <div className="rounded-2xl bg-white p-5 shadow-2xl border-4 border-oromo-green">
            {/* Header strip */}
            <div className="mb-3 flex items-center justify-between border-b border-oromo-green/20 pb-2">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">
                  {language === 'or' ? 'Ida\'aa Biyyaalessaa Itoophiyaa' : 'Federal Democratic Republic of Ethiopia'}
                </div>
                <div className="text-sm font-bold text-oromo-green-dark">
                  {language === 'or' ? 'Kaardii Ida\'aa Biyyaalessaa' : 'National ID Card'}
                </div>
              </div>
              <div className="text-oromo-yellow font-bold">-------------</div>
            </div>

            {/* QR */}
            <div className="flex justify-center bg-white p-3">
              <img
                src={`/api/demo-card?id=${encodeURIComponent(selected.id)}`}
                alt="QR"
                className="h-56 w-56"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>

            {/* Visitor info */}
            <div className="mt-3 space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">{t(language, 'visitor')}: </span>
                <span className="font-bold">{selected.fullName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t(language, 'nationalId')}: </span>
                <span className="font-mono">{selected.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t(language, 'dateOfBirth')}: </span>
                {selected.dateOfBirth}
              </div>
              <div>
                <span className="text-muted-foreground">{t(language, 'gender')}: </span>
                {selected.gender}
              </div>
              <div>
                <span className="text-muted-foreground">{t(language, 'region')}: </span>
                {selected.region}
              </div>
            </div>

            {selected.blocked && (
              <div className="mt-3 flex items-center justify-center rounded-md bg-red-50 p-2 text-red-700">
                <ShieldAlert className="mr-1 h-4 w-4" />
                <span className="text-xs font-bold uppercase">Blocklisted</span>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {language === 'or'
                ? 'QR kana kaameraa sukaaksaa Isaanitiin suukaaksi'
                : 'Scan this QR using the Scanner tab'}
            </p>
          </div>

          <button
            onClick={() => setSelected(null)}
            className="mt-4 w-full rounded-lg border border-oromo-green/30 bg-white py-2 text-sm font-medium text-oromo-green-dark hover:bg-oromo-green/5"
          >
            {t(language, 'back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 bg-oromo-cream p-4">
      <div>
        <h2 className="text-xl font-bold text-oromo-green-dark">
          {language === 'or' ? 'Kaartii Dorgommii' : 'Demo ID Cards'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {language === 'or'
            ? 'Dhiyaataa fili - QR isaa mul\'isi - gara kaameraatti qajeessi'
            : 'Pick a visitor — show their QR — point the scanner at it'}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={language === 'or' ? 'Barbaadi...' : 'Search...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white pl-9"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelected(v)}
            className={cn(
              'rounded-lg border bg-white p-3 text-left shadow-sm transition hover:shadow-md',
              v.blocked ? 'border-red-300' : 'border-oromo-yellow/40',
            )}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{v.fullName}</div>
                <div className="truncate font-mono text-xs text-muted-foreground">
                  {v.id.slice(0, 8)}...
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {v.gender} · {v.region.split(' - ')[0]}
                </div>
              </div>
              {v.blocked ? (
                <Badge variant="destructive" className="text-[9px]">BLOCKED</Badge>
              ) : (
                <QrCode className="h-5 w-5 text-oromo-green" />
              )}
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {language === 'or' ? 'Waa\'i hin jiru' : 'No matches'}
        </p>
      )}
    </div>
  )
}
