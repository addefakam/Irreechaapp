// GET /api/visitors/[id]
// Look up a visitor by national ID number. Used by gate devices when a QR is
// scanned — to fetch the full registry record (and confirm the ID exists).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const trimmed = id.trim()
  if (!trimmed) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }
  const visitor = await db.visitor.findUnique({
    where: { id: trimmed },
    include: { blocklistEntry: true },
  })
  if (!visitor) {
    return NextResponse.json(
      { found: false, message: 'Visitor not in registry' },
      { status: 404 },
    )
  }
  return NextResponse.json({
    found: true,
    visitor: {
      id: visitor.id,
      fullName: visitor.fullName,
      dateOfBirth: visitor.dateOfBirth,
      gender: visitor.gender,
      region: visitor.region,
      issuedAt: visitor.issuedAt,
    },
    blocklist: visitor.blocklistEntry
      ? {
          reason: visitor.blocklistEntry.reason,
          severity: visitor.blocklistEntry.severity,
          addedAt: visitor.blocklistEntry.addedAt.toISOString(),
        }
      : null,
  })
}
