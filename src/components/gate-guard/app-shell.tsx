// App shell — top-level layout with bottom navigation, handles routing between views

'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { CulturalHeader } from './cultural-header'
import { SyncStatusBar } from './sync-status-bar'
import { LoginView } from './login-view'
import { ScannerView } from './scanner-view'
import { DashboardView } from './dashboard-view'
import { AnalyticsView } from './analytics-view'
import { BlocklistView } from './blocklist-view'
import { DemoCardView } from './demo-card-view'
import { Camera, LayoutDashboard, BarChart3, ShieldAlert, IdCard } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'scanner' | 'dashboard' | 'analytics' | 'blocklist' | 'demo'

export function AppShell() {
  const { session, language } = useAppStore()
  const [activeTab, setActiveTab] = useState<Tab>('scanner')

  // If not signed in, show login screen
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-oromo-cream">
        <CulturalHeader />
        <LoginView />
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-oromo-cream">
      <CulturalHeader />
      <SyncStatusBar />

      <main className="flex flex-1 flex-col">
        {activeTab === 'scanner' && <ScannerView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'blocklist' && <BlocklistView />}
        {activeTab === 'demo' && <DemoCardView />}
      </main>

      {/* Bottom navigation — mobile-first */}
      <nav className="sticky bottom-0 z-30 border-t border-oromo-yellow/30 bg-white shadow-lg">
        <div className="mx-auto flex max-w-5xl">
          <TabButton
            active={activeTab === 'scanner'}
            onClick={() => setActiveTab('scanner')}
            icon={<Camera className="h-5 w-5" />}
            label={t(language, 'navScanner')}
            highlight
          />
          <TabButton
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard className="h-5 w-5" />}
            label={t(language, 'navDashboard')}
          />
          <TabButton
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon={<BarChart3 className="h-5 w-5" />}
            label={t(language, 'navAnalytics')}
          />
          <TabButton
            active={activeTab === 'blocklist'}
            onClick={() => setActiveTab('blocklist')}
            icon={<ShieldAlert className="h-5 w-5" />}
            label={t(language, 'navBlocklist')}
          />
          <TabButton
            active={activeTab === 'demo'}
            onClick={() => setActiveTab('demo')}
            icon={<IdCard className="h-5 w-5" />}
            label={language === 'or' ? 'Kaartii' : 'Demo Cards'}
          />
        </div>
      </nav>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  highlight,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
        active
          ? 'text-oromo-green'
          : 'text-muted-foreground hover:text-oromo-green-dark',
        highlight && !active && 'bg-oromo-green/5',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          active && 'bg-oromo-green text-white',
        )}
      >
        {icon}
      </div>
      <span className="truncate">{label}</span>
    </button>
  )
}

function Footer() {
  const { language } = useAppStore()
  return (
    <footer className="mt-auto bg-oromo-green-dark px-4 py-3 text-center text-xs text-white/80">
      <div className="mx-auto max-w-5xl">
        {t(language, 'footerText')}
      </div>
    </footer>
  )
}
