// Login view — gate operator picks a gate and enters a 4-digit PIN

'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { Loader2, Lock, MapPin, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type GateOption = {
  id: string
  code: string
  nameEn: string
  nameOr: string
}

// Demo PIN map — any of these PINs unlocks any gate
const VALID_PINS = ['1001', '1002', '1003', '1004']

export function LoginView() {
  const { language, signIn } = useAppStore()
  const [gates, setGates] = useState<GateOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGateId, setSelectedGateId] = useState<string>('')
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/gates')
        const data = await res.json()
        if (cancelled) return
        setGates(data.gates || [])
        if (data.gates?.length > 0) {
          setSelectedGateId(data.gates[0].id)
        }
      } catch {
        // ignore — UI still works without gates list
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedGateId) {
      setError(t(language, 'invalidPin'))
      return
    }
    if (!/^\d{4}$/.test(pin)) {
      setError(t(language, 'invalidPin'))
      return
    }
    if (!VALID_PINS.includes(pin)) {
      setError(t(language, 'loginFailed'))
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      const gate = gates.find((g) => g.id === selectedGateId)
      if (!gate) {
        setError(t(language, 'loginFailed'))
        setSubmitting(false)
        return
      }
      signIn({
        gateId: gate.id,
        gateCode: gate.code,
        gateNameEn: gate.nameEn,
        gateNameOr: gate.nameOr,
        operatorPin: pin,
        loginAt: new Date().toISOString(),
      })
      setSubmitting(false)
    }, 400)
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-oromo-cream px-4">
        <Loader2 className="h-8 w-8 animate-spin text-oromo-green" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-oromo-cream px-4 py-8">
      <div className="w-full max-w-md">
        {/* Cultural banner above the form */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-oromo-green text-white shadow-lg">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-oromo-green-dark">
            {t(language, 'loginTitle')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(language, 'loginSubtitle')}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-oromo-yellow/40 bg-white p-6 shadow-xl"
        >
          {/* Gate select */}
          <div className="space-y-2">
            <Label htmlFor="gate" className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="h-4 w-4 text-oromo-green" />
              {t(language, 'selectGate')}
            </Label>
            <Select value={selectedGateId} onValueChange={setSelectedGateId}>
              <SelectTrigger id="gate" className="bg-white">
                <SelectValue placeholder={t(language, 'selectGate')} />
              </SelectTrigger>
              <SelectContent>
                {gates.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    <span className="font-medium">{g.code}</span>
                    <span className="text-muted-foreground">
                      {' '}— {language === 'or' ? g.nameOr : g.nameEn}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PIN input */}
          <div className="space-y-2">
            <Label htmlFor="pin" className="flex items-center gap-1.5 text-sm font-medium">
              <Lock className="h-4 w-4 text-oromo-green" />
              {t(language, 'enterPin')}
            </Label>
            <Input
              id="pin"
              type="tel"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              className="bg-white text-center text-2xl tracking-[0.5em] font-mono"
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-oromo-green hover:bg-oromo-green-dark text-white text-base py-6"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {t(language, 'signingIn')}
              </>
            ) : (
              t(language, 'signIn')
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {t(language, 'demoHint')}
          </p>
        </form>

        {/* Cultural footer strip */}
        <div className="mt-6 h-1.5 w-full rounded-full bg-gradient-to-r from-oromo-yellow via-oromo-red to-oromo-yellow opacity-60" />
      </div>
    </div>
  )
}
