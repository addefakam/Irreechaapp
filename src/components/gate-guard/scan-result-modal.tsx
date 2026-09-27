// Scan result modal — full-screen admit/block popup

'use client'

import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { CheckCircle2, XOctagon, AlertTriangle, UserX, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScanOutcome } from './scanner-view'

type Props = {
  outcome: ScanOutcome
  onClose: () => void
  onOverride: () => void
}

export function ScanResultModal({ outcome, onClose, onOverride }: Props) {
  const { language } = useAppStore()
  const isBlocked = outcome.status === 'BLOCKED'
  const isReentry = outcome.status === 'REENTRY_WARN'
  const isNotFound = outcome.status === 'NOT_FOUND'
  const isAdmitted = outcome.status === 'ADMITTED'

  const accentColor = isBlocked
    ? 'bg-red-600'
    : isReentry
      ? 'bg-amber-500'
      : isNotFound
        ? 'bg-orange-500'
        : 'bg-oromo-green'

  const Icon = isBlocked
    ? XOctagon
    : isReentry
      ? AlertTriangle
      : isNotFound
        ? UserX
        : CheckCircle2

  const title = isBlocked
    ? t(language, 'blocked')
    : isReentry
      ? t(language, 'reentryWarn')
      : isNotFound
        ? t(language, 'visitorNotFound')
        : t(language, 'admitted')

  const desc = isBlocked
    ? t(language, 'blockedDesc')
    : isReentry
      ? t(language, 'reentryWarnDesc')
      : isNotFound
        ? t(language, 'visitorNotFoundDesc')
        : t(language, 'admittedDesc')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center px-4 py-6 text-white',
          accentColor,
        )}
      >
        {/* Big status icon */}
        <div className="mb-6 animate-in fade-in zoom-in duration-300">
          <Icon className={cn('h-32 w-32', isBlocked && 'animate-pulse')} strokeWidth={1.5} />
        </div>

        <h2 className="text-4xl font-black uppercase tracking-tight">{title}</h2>
        <p className="mt-2 text-base text-white/90">{desc}</p>

        {/* Visitor card */}
        {outcome.visitor && (
          <div className="mt-6 w-full max-w-sm rounded-xl bg-white/15 p-4 text-left backdrop-blur-sm">
            <div className="border-b border-white/20 pb-2">
              <div className="text-xs uppercase tracking-wide text-white/70">
                {t(language, 'visitor')}
              </div>
              <div className="text-lg font-bold">{outcome.visitor.fullName}</div>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/70">{t(language, 'nationalId')}</dt>
                <dd className="font-mono">{outcome.visitor.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/70">{t(language, 'dateOfBirth')}</dt>
                <dd>{outcome.visitor.dateOfBirth}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/70">{t(language, 'gender')}</dt>
                <dd>{outcome.visitor.gender}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/70">{t(language, 'region')}</dt>
                <dd>{outcome.visitor.region}</dd>
              </div>
            </dl>

            {isBlocked && outcome.blocklist && (
              <div className="mt-3 rounded-md bg-white/15 p-2 text-sm">
                <div className="text-xs uppercase text-white/70">
                  {t(language, 'blocklistReason')}
                </div>
                <div className="font-semibold">{outcome.blocklist.reason}</div>
                <div className="text-xs text-white/80">
                  {t(language, 'severity')}: {t(language, outcome.blocklist.severity.toLowerCase() as 'high' | 'medium' | 'low')}
                </div>
              </div>
            )}

            {isReentry && outcome.reentryScan && (
              <div className="mt-3 rounded-md bg-white/15 p-2 text-sm">
                <div className="text-xs uppercase text-white/70">
                  {t(language, 'lastScanned')}
                </div>
                <div className="font-semibold">
                  {new Date(outcome.reentryScan.scannedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
          {isBlocked ? (
            <>
              <Button
                onClick={onClose}
                className="w-full bg-white py-6 text-base font-bold text-red-700 hover:bg-white/90"
              >
                {t(language, 'close')}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-white/50 bg-transparent py-5 text-base text-white hover:bg-white/10"
              >
                <Phone className="mr-2 h-4 w-4" />
                {t(language, 'callSecurity')}
              </Button>
            </>
          ) : isReentry ? (
            <>
              <Button
                onClick={onClose}
                className="w-full bg-white py-6 text-base font-bold text-amber-700 hover:bg-white/90"
              >
                {t(language, 'close')}
              </Button>
              <Button
                onClick={onOverride}
                variant="outline"
                className="w-full border-white/50 bg-transparent py-5 text-base text-white hover:bg-white/10"
              >
                {t(language, 'continueAnyway')}
              </Button>
            </>
          ) : (
            <Button
              onClick={onClose}
              className="w-full bg-white py-6 text-base font-bold text-oromo-green hover:bg-white/90"
            >
              {t(language, 'scanAnother')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
