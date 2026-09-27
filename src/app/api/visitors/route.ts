// GET /api/visitors
// Returns a paginated list of visitors (for the demo card selector).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '20', 10)
  const search = url.searchParams.get('search') || ''

  const visitors = await db.visitor.findMany({
    take: Math.min(limit, 100),
    where: search
      ? { OR: [
          { id: { contains: search } },
          { fullName: { contains: search } },
        ] }
      : undefined,
    orderBy: { createdAt: 'desc' },
  })

  // Also fetch blocklist ids for display
  const blocklistEntries = await db.blocklistEntry.findMany({ select: { visitorId: true } })
  const blockedIds = new Set(blocklistEntries.map((b) => b.visitorId))

  return NextResponse.json({
    visitors: visitors.map((v) => ({
      id: v.id,
      fullName: v.fullName,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      region: v.region,
      blocked: blockedIds.has(v.id),
    })),
  })
}
