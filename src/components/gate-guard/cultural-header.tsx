// Cultural header — Oromo-themed top bar with green/yellow/red accents

'use client'

import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { Languages, LogOut } from 'lucide-react'

export function CulturalHeader() {
  const { language, setLanguage, session, signOut } = useAppStore()

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-oromo-green via-oromo-green to-oromo-green-dark text-white shadow-lg">
      <div className="h-1.5 w-full bg-gradient-to-r from-oromo-yellow via-oromo-red to-oromo-yellow" />

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 flex-shrink-0 rounded-full bg-white/15 p-1">
            <div className="h-full w-full rounded-full border-2 border-oromo-yellow" />
            <div className="absolute inset-0 flex items-center justify-center text-oromo-yellow text-lg font-bold">
              &#9767;
            </div>
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold">{t(language, 'appName')}</div>
            <div className="text-[11px] text-white/80">
              {session
                ? language === 'or'
                  ? session.gateNameOr
                  : session.gateNameEn
                : t(language, 'appTagline')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'or' : 'en')}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25 transition-colors"
            aria-label="Toggle language"
          >
            <Languages className="h-3.5 w-3.5" />
            {language === 'en' ? 'EN' : 'OR'}
          </button>

          {session && (
            <button
              onClick={() => {
                if (confirm(language === 'or' ? "Ba'i?" : 'Sign out?')) {
                  signOut()
                }
              }}
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t(language, 'signOut')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
