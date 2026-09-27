// App shell — ultra-minimal: login OR scanner. No tabs, no navigation.
// Header shows: app name + gate + today's count + sync status.

'use client'

import { useAppStore } from '@/lib/store'
import { CulturalHeader } from './cultural-header'
import { SyncStatusBar } from './sync-status-bar'
import { LoginView } from './login-view'
import { ScannerView } from './scanner-view'
import { t } from '@/lib/i18n'

export function AppShell() {
  const { session, language } = useAppStore()

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-oromo-cream">
        <CulturalHeader />
        <LoginView />
        <footer className="mt-auto bg-oromo-green-dark px-4 py-3 text-center text-xs text-white/80">
          <div className="mx-auto max-w-5xl">
            {t(language, 'footerText')}
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-oromo-cream">
      <CulturalHeader />
      <SyncStatusBar />
      <main className="flex flex-1 flex-col">
        <ScannerView />
      </main>
    </div>
  )
}
