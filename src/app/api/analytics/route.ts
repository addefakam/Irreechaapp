// GET /api/analytics
// Returns aggregated analytics for the dashboard: arrivals per hour, per gate,
// day-over-day totals, busiest hour & gate.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const dayOffsetParam = url.searchParams.get('day')
  const dayOffset = dayOffsetParam ? parseInt(dayOffsetParam, 10) : 0

  const targetDay = new Date()
  targetDay.setDate(targetDay.getDate() - dayOffset)
  targetDay.setHours(0, 0, 0, 0)
  const dayEnd = new Date(targetDay)
  dayEnd.setHours(23, 59, 59, 999)

  // Fetch all scans for the target day
  const scans = await db.scan.findMany({
    where: { scannedAt: { gte: targetDay, lte: dayEnd } },
    include: { gate: true },
    orderBy: { scannedAt: 'asc' },
  })

  // Arrivals per hour (06:00 to 18:00 — festival hours)
  const hours: { hour: number; count: number; admitted: number; blocked: number }[] = []
  for (let h = 6; h <= 18; h++) {
    const inHour = scans.filter((s) => {
      const hh = new Date(s.scannedAt).getHours()
      return hh === h
    })
    hours.push({
      hour: h,
      count: inHour.length,
      admitted: inHour.filter((s) => s.status === 'ADMITTED').length,
      blocked: inHour.filter((s) => s.status === 'BLOCKED').length,
    })
  }

  // Arrivals per gate
  const gates = await db.gate.findMany({ orderBy: { code: 'asc' } })
  const perGate = gates.map((g) => {
    const gateScans = scans.filter((s) => s.gateId === g.id)
    return {
      gateId: g.id,
      gateCode: g.code,
      gateNameEn: g.nameEn,
      gateNameOr: g.nameOr,
      count: gateScans.length,
      admitted: gateScans.filter((s) => s.status === 'ADMITTED').length,
      blocked: gateScans.filter((s) => s.status === 'BLOCKED').length,
      capacity: g.capacity,
    }
  })

  // Day-over-day totals (last 7 days)
  const dayOverDay: { date: string; count: number; admitted: number; blocked: number }[] = []
  for (let d = 6; d >= 0; d--) {
    const dayStart = new Date()
    dayStart.setDate(dayStart.getDate() - d)
    dayStart.setHours(0, 0, 0, 0)
    const dayStop = new Date(dayStart)
    dayStop.setHours(23, 59, 59, 999)
    const dayScans = await db.scan.findMany({
      where: { scannedAt: { gte: dayStart, lte: dayStop } },
    })
    dayOverDay.push({
      date: dayStart.toISOString().slice(0, 10),
      count: dayScans.length,
      admitted: dayScans.filter((s) => s.status === 'ADMITTED').length,
      blocked: dayScans.filter((s) => s.status === 'BLOCKED').length,
    })
  }

  // Busiest hour / gate
  const busiestHour = hours.reduce(
    (max, h) => (h.count > max.count ? h : max),
    { hour: 0, count: 0 },
  )
  const busiestGate = perGate.reduce(
    (max, g) => (g.count > max.count ? g : max),
    { gateCode: '', count: 0 },
  )

  const totalArrivals = scans.length
  const totalAdmitted = scans.filter((s) => s.status === 'ADMITTED').length
  const totalBlocked = scans.filter((s) => s.status === 'BLOCKED').length

  return NextResponse.json({
    day: targetDay.toISOString().slice(0, 10),
    dayOffset,
    hours,
    perGate,
    dayOverDay,
    busiestHour: busiestHour.hour,
    busiestGate: busiestGate.gateCode,
    totalArrivals,
    totalAdmitted,
    totalBlocked,
  })
}
