# Irreecha GateGuard

A bilingual (English + Afaan Oromoo) Android-installable PWA for scanning visitors' national ID QR codes at the Irreecha festival gates. Captures the visitor data from the QR, stores it locally (offline-first), and syncs to a central server when network is available.

## Quick start

```bash
# 1. Install dependencies
bun install

# 2. Set up your local database
cp .env.example .env
bun run db:push        # create SQLite schema
bun run prisma/seed.ts # populate 5 gates, 200 visitors, sample scans

# 3. Run the dev server
bun run dev
```

Open http://localhost:3000 and sign in with PIN `1001` (any gate).

## QR format

The scanner parses QR codes in this format:

```
ETH-ID|<idNumber>|<fullName>|<YYYY-MM-DD>|<M|F>|<region>|<YYYY-MM-DD issueDate>
```

If your national ID QR uses a different format, update `parseEthiopianQR()` in `src/lib/qr.ts`.

## How to install on Android

1. Open the app URL in Chrome on an Android phone
2. Browser menu → "Add to Home Screen"
3. Open the installed "GateGuard" app

## Offline-first behavior

- Every scan saves to IndexedDB immediately (instant UI)
- Auto-syncs to `/api/sync` when network returns
- Blocklist cached locally for offline lookups
- Service worker caches the app shell so the PWA itself works offline

## Architecture

- **Frontend**: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui
- **Backend**: Prisma + SQLite (`/api/sync` is the central store endpoint)
- **Offline**: IndexedDB via `idb` library, service worker for app shell
- **Scanner**: `jsqr` for QR decoding from live camera feed
- **State**: Zustand for language/session, persistent in localStorage

## Demo PINs

`1001`, `1002`, `1003`, `1004` — any PIN unlocks any gate.

## File structure

```
prisma/schema.prisma      # Visitor, Scan, Gate, BlocklistEntry models
prisma/seed.ts            # generates mock data
src/lib/idb.ts            # IndexedDB offline-first store
src/lib/qr.ts             # camera + jsQR hook
src/lib/i18n.ts           # bilingual labels (English + Afaan Oromoo)
src/lib/store.ts          # Zustand app state
src/lib/mock-data.ts      # 200 visitors + 5 gates + 5 blocklist + PINs
src/app/api/sync/route.ts # the "center" — receives synced scans
src/app/page.tsx          # main entry
src/components/gate-guard/ # login, scanner, sync bar, header, app shell
public/manifest.json      # PWA manifest
public/sw.js              # service worker
```
