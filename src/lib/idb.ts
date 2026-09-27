// Irreecha GateGuard — Offline-first IndexedDB store
// All scans are saved locally first (instant UI), then queued for sync.
// Even if offline, scanning keeps working — syncs when network returns.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export type LocalScan = {
  // client-generated UUID; the server may reassign on sync
  localId: string
  visitorId: string
  visitorName: string | null
  gateId: string
  gateCode: string
  operatorPin: string
  status: 'SCANNED' | 'ADMITTED' | 'BLOCKED' | 'REENTRY_WARN' | 'NOT_FOUND'
  reason: string | null
  scannedAt: string // ISO timestamp
  synced: 0 | 1 // 0 = pending, 1 = synced
  syncedAt: string | null
  payload: string // serialized QR payload (for audit)
}

export type LocalBlocklistEntry = {
  visitorId: string
  visitorName: string | null
  reason: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  cachedAt: string
}

export type LocalVisitorCache = {
  id: string
  fullName: string
  dateOfBirth: string
  gender: string
  region: string
  issuedAt: string
  cachedAt: string
}

interface GateGuardDB extends DBSchema {
  scans: {
    key: string
    value: LocalScan
    indexes: { 'by-synced': number; 'by-visitor': string; 'by-time': string }
  }
  blocklist: {
    key: string
    value: LocalBlocklistEntry
  }
  visitors: {
    key: string
    value: LocalVisitorCache
  }
  meta: {
    key: string
    value: { key: string; value: string }
  }
}

let dbPromise: Promise<IDBPDatabase<GateGuardDB>> | null = null

export function getDB() {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB only available in browser')
  }
  if (!dbPromise) {
    dbPromise = openDB<GateGuardDB>('irreecha-gateguard', 1, {
      upgrade(db) {
        const scans = db.createObjectStore('scans', { keyPath: 'localId' })
        scans.createIndex('by-synced', 'synced')
        scans.createIndex('by-visitor', 'visitorId')
        scans.createIndex('by-time', 'scannedAt')

        db.createObjectStore('blocklist', { keyPath: 'visitorId' })
        db.createObjectStore('visitors', { keyPath: 'id' })
        db.createObjectStore('meta', { keyPath: 'key' })
      },
    })
  }
  return dbPromise
}

// ---- Scans ----

export async function saveScanLocal(scan: LocalScan): Promise<void> {
  const db = await getDB()
  await db.put('scans', scan)
}

export async function getPendingScans(): Promise<LocalScan[]> {
  const db = await getDB()
  return db.getAllFromIndex('scans', 'by-synced', 0)
}

export async function getAllLocalScans(limit = 100): Promise<LocalScan[]> {
  const db = await getDB()
  const all = await db.getAll('scans')
  return all.sort((a, b) => (b.scannedAt > a.scannedAt ? 1 : -1)).slice(0, limit)
}

export async function getTodayLocalScans(gateId?: string): Promise<LocalScan[]> {
  const db = await getDB()
  const all = await db.getAll('scans')
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startISO = startOfToday.toISOString()
  return all
    .filter((s) => s.scannedAt >= startISO)
    .filter((s) => !gateId || s.gateId === gateId)
    .sort((a, b) => (b.scannedAt > a.scannedAt ? 1 : -1))
}

export async function markScanSynced(localId: string): Promise<void> {
  const db = await getDB()
  const existing = await db.get('scans', localId)
  if (!existing) return
  await db.put('scans', {
    ...existing,
    synced: 1,
    syncedAt: new Date().toISOString(),
  })
}

// ---- Blocklist cache ----

export async function cacheBlocklistEntries(entries: LocalBlocklistEntry[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('blocklist', 'readwrite')
  await tx.store.clear()
  for (const e of entries) {
    await tx.store.put(e)
  }
  await tx.done
  await setMeta('blocklistCachedAt', new Date().toISOString())
}

export async function getLocalBlocklist(): Promise<LocalBlocklistEntry[]> {
  const db = await getDB()
  return db.getAll('blocklist')
}

export async function isVisitorBlocked(
  visitorId: string,
): Promise<LocalBlocklistEntry | null> {
  const db = await getDB()
  return (await db.get('blocklist', visitorId)) ?? null
}

// ---- Visitor cache (for re-entry detection when offline) ----

export async function cacheVisitor(v: LocalVisitorCache): Promise<void> {
  const db = await getDB()
  await db.put('visitors', v)
}

export async function getCachedVisitor(id: string): Promise<LocalVisitorCache | null> {
  const db = await getDB()
  return (await db.get('visitors', id)) ?? null
}

// ---- Re-entry detection: any scan within 4 hours for this visitor ----

export async function checkRecentReentry(visitorId: string, hoursWindow = 4): Promise<LocalScan | null> {
  const db = await getDB()
  const all = await db.getAllFromIndex('scans', 'by-visitor', visitorId)
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - hoursWindow)
  const cutoffISO = cutoff.toISOString()
  return all
    .filter((s) => s.scannedAt >= cutoffISO)
    .sort((a, b) => (b.scannedAt > a.scannedAt ? 1 : -1))[0] ?? null
}

// ---- Meta (sync timestamps, etc.) ----

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDB()
  await db.put('meta', { key, value })
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDB()
  const rec = await db.get('meta', key)
  return rec?.value ?? null
}
