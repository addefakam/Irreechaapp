// Irreecha GateGuard — Mock data + seed script
// Run with: bun run prisma/seed.ts

import { PrismaClient } from '@prisma/client'
import { mockVisitors, mockGates, mockBlocklist } from '../src/lib/mock-data'

const db = new PrismaClient()

async function seed() {
  console.log('Seeding Irreecha GateGuard database...')

  // 1. Gates
  console.log(`- Seeding ${mockGates.length} gates`)
  await db.gate.deleteMany()
  for (const gate of mockGates) {
    await db.gate.create({ data: gate })
  }

  // 2. Visitors
  console.log(`- Seeding ${mockVisitors.length} visitors`)
  await db.visitor.deleteMany()
  for (const v of mockVisitors) {
    await db.visitor.create({ data: v })
  }

  // 3. Blocklist
  console.log(`- Seeding ${mockBlocklist.length} blocklist entries`)
  await db.blocklistEntry.deleteMany()
  for (const b of mockBlocklist) {
    await db.blocklistEntry.create({ data: b })
  }

  // 4. Mock historical scans (3 days, varied distribution)
  console.log('- Seeding historical scans (3 days)')
  await db.scan.deleteMany()
  const gates = await db.gate.findMany()
  const visitors = await db.visitor.findMany()
  const blockedIds = new Set(mockBlocklist.map((b) => b.visitorId))

  const now = new Date()
  const operators = ['1001', '1002', '1003', '1004']

  // Day -3, -2, -1
  for (let dayOffset = 3; dayOffset >= 1; dayOffset--) {
    const dayDate = new Date(now)
    dayDate.setDate(now.getDate() - dayOffset)

    // Peak hours: 6am-10am and 2pm-6pm
    for (let hour = 6; hour <= 18; hour++) {
      // More scans during peak hours
      const peakFactor =
        (hour >= 6 && hour <= 10) || (hour >= 14 && hour <= 18) ? 12 : 4

      for (let i = 0; i < peakFactor; i++) {
        const visitor = visitors[Math.floor(Math.random() * visitors.length)]
        const gate = gates[Math.floor(Math.random() * gates.length)]
        const scanTime = new Date(dayDate)
        scanTime.setHours(hour, Math.floor(Math.random() * 60), 0, 0)

        const isBlocked = blockedIds.has(visitor.id)
        // some re-entries
        const status = isBlocked
          ? 'BLOCKED'
          : Math.random() < 0.05
            ? 'REENTRY_WARN'
            : 'ADMITTED'

        await db.scan.create({
          data: {
            visitorId: visitor.id,
            gateId: gate.id,
            operatorPin: operators[Math.floor(Math.random() * operators.length)],
            status,
            reason: isBlocked
              ? 'Blocklist match'
              : status === 'REENTRY_WARN'
                ? 'Re-entry within 4h'
                : null,
            scannedAt: scanTime,
          },
        })
      }
    }
  }

  console.log('Seed complete.')
  const counts = {
    gates: await db.gate.count(),
    visitors: await db.visitor.count(),
    blocklist: await db.blocklistEntry.count(),
    scans: await db.scan.count(),
  }
  console.log(counts)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
