// GET /api/blocklist
// Returns the current blocklist entries with visitor info attached.
// Devices refresh this periodically (when online) and cache locally.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const entries = await db.blocklistEntry.findMany({
    include: { visitor: true },
    orderBy: [{ severity: 'asc' }, { addedAt: 'desc' }],
  })
  const data = entries.map((e) => ({
    visitorId: e.visitorId,
    visitorName: e.visitor?.fullName ?? 'Unknown',
    reason: e.reason,
    severity: e.severity,
    addedAt: e.addedAt.toISOString(),
  }))
  return NextResponse.json({ entries: data, cachedAt: new Date().toISOString() })
}
