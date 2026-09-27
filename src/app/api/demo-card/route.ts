// GET /api/demo-card?id=<idNumber>
// Returns a QR PNG encoding the Ethiopian ID QR payload for that visitor.
// Used to test the scanner end-to-end: display this image on one phone, scan with another.

import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }
  const visitor = await db.visitor.findUnique({ where: { id } })
  if (!visitor) {
    return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
  }

  // Build the QR payload in the same format the scanner parses
  const payload = `ETH-ID|${visitor.id}|${visitor.fullName}|${visitor.dateOfBirth}|${visitor.gender}|${visitor.region}|${visitor.issuedAt}`

  const png = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
    color: { dark: '#0b3d2e', light: '#ffffff' },
  })

  // Strip the data URL prefix
  const base64 = png.split(',')[1]
  const buffer = Buffer.from(base64, 'base64')
  return new NextResponse(Uint8Array.from(buffer).buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  })
}
