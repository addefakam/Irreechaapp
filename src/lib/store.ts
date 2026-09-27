// Irreecha GateGuard — Client app state (Zustand)
// Tracks: language preference, current operator session, sync state.

'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Language } from './i18n'

export type GateSession = {
  gateId: string
  gateCode: string
  gateNameEn: string
  gateNameOr: string
  operatorPin: string
  loginAt: string // ISO
}

export type SyncState = {
  online: boolean
  lastSyncAt: string | null
  pendingCount: number
  syncing: boolean
}

type AppState = {
  // Language
  language: Language
  setLanguage: (lang: Language) => void

  // Session
  session: GateSession | null
  signIn: (gate: GateSession) => void
  signOut: () => void

  // Sync
  sync: SyncState
  setOnline: (online: boolean) => void
  setLastSyncAt: (iso: string) => void
  setPendingCount: (n: number) => void
  setSyncing: (syncing: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),

      session: null,
      signIn: (gate) => set({ session: gate }),
      signOut: () => set({ session: null }),

      sync: {
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
        lastSyncAt: null,
        pendingCount: 0,
        syncing: false,
      },
      setOnline: (online) => set((s) => ({ sync: { ...s.sync, online } })),
      setLastSyncAt: (iso) => set((s) => ({ sync: { ...s.sync, lastSyncAt: iso } })),
      setPendingCount: (n) => set((s) => ({ sync: { ...s.sync, pendingCount: n } })),
      setSyncing: (syncing) => set((s) => ({ sync: { ...s.sync, syncing } })),
    }),
    {
      name: 'irreecha-gateguard',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as unknown as Storage))),
      // Don't persist sync state — it's runtime
      partialize: (s) => ({ language: s.language, session: s.session }),
    },
  ),
)
