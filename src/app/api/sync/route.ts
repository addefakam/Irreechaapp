// POST /api/sync
// Receives an array of scans from a gate device (the "push to center" endpoint).
// Idempotent on (visitorId, scannedAt, gateId).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { LocalScan } from '@/lib/idb'

type SyncBody = { scans: LocalScan[]; device: string }

export async function POST(req: Request) {
  let body: SyncBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const scans = Array.isArray(body?.scans) ? body.scans : []
  if (scans.length === 0) {
    return NextResponse.json({ ok: true, received: 0, saved: 0 })
  }

  let saved = 0
  let skipped = 0
  for (const s of scans) {
    if (!s.visitorId || !s.gateId || !s.scannedAt || !s.status) {
      skipped++
      continue
    }
    const gate = await db.gate.findUnique({ where: { id: s.gateId } })
    if (!gate) {
      skipped++
      continue
    }
    let visitor = await db.visitor.findUnique({ where: { id: s.visitorId } })
    if (!visitor) {
      visitor = await db.visitor.create({
        data: {
          id: s.visitorId,
          fullName: s.visitorName ?? 'Unknown Visitor',
          dateOfBirth: '1970-01-01',
          gender: 'U',
          region: 'Unknown',
          issuedAt: '1970-01-01',
        },
      })
    }
    const existing = await db.scan.findFirst({
      where: {
        visitorId: s.visitorId,
        gateId: s.gateId,
        scannedAt: new Date(s.scannedAt),
      },
    })
    if (existing) {
      skipped++
      continue
    }
    await db.scan.create({
      data: {
        visitorId: s.visitorId,
        gateId: s.gateId,
        operatorPin: s.operatorPin,
        status: s.status,
        reason: s.reason,
        scannedAt: new Date(s.scannedAt),
        syncedFrom: body.device || 'unknown',
      },
    })
    saved++
  }
  return NextResponse.json({ ok: true, received: scans.length, saved, skipped })
}
