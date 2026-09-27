// GET /api/gates
// Returns list of all gates for the login screen.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const gates = await db.gate.findMany({ orderBy: { code: 'asc' } })
  return NextResponse.json({ gates })
}
