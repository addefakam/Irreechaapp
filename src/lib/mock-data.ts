// Irreecha GateGuard — Mock data for visitors, gates, and blocklist
// This data represents what would come from the Ethiopian national ID registry
// in a real deployment. For demo purposes, we generate realistic-looking records.

// The QR code payload format (what's encoded on the physical ID card):
// ETH-ID|<idNumber>|<fullName>|<YYYY-MM-DD>|<M|F>|<region>|<YYYY-MM-DD issueDate>

export type VisitorRecord = {
  id: string // National ID number (16 digits)
  fullName: string
  dateOfBirth: string
  gender: 'M' | 'F'
  region: string
  issuedAt: string
  createdAt: Date
}

export type GateRecord = {
  id: string
  code: string
  nameEn: string
  nameOr: string
  capacity: number
}

export type BlocklistEntryRecord = {
  visitorId: string
  reason: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  addedBy: string
}

// ---- Gates around Hora Harsadi (Bishoftu / Debre Zeyit) ----
export const mockGates: GateRecord[] = [
  {
    id: 'gate-main',
    code: 'HORARSADI',
    nameEn: 'Hora Harsadi Main Gate',
    nameOr: 'Gaala Guddaa Hora Harsadi',
    capacity: 3000,
  },
  {
    id: 'gate-north',
    code: 'BISH_N',
    nameEn: 'Bishoftu North Gate',
    nameOr: 'Gaala Kaabaa Bishoftuu',
    capacity: 1500,
  },
  {
    id: 'gate-south',
    code: 'BISH_S',
    nameEn: 'Bishoftu South Gate',
    nameOr: 'Gaala Kibbaa Bishoftuu',
    capacity: 1500,
  },
  {
    id: 'gate-east',
    code: 'BISH_E',
    nameEn: 'Bishoftu East Gate',
    nameOr: 'Gaala Baha Bishoftuu',
    capacity: 1200,
  },
  {
    id: 'gate-west',
    code: 'BISH_W',
    nameEn: 'Bishoftu West Gate',
    nameOr: 'Gaala Dhihaa Bishoftuu',
    capacity: 1200,
  },
]

// Operator PINs (demo): 1001, 1002, 1003, 1004
export const VALID_PINS = ['1001', '1002', '1003', '1004']

// ---- Sample Oromo / Ethiopian names ----
const firstNamesM = [
  'Tadesse', 'Bekele', 'Demisse', 'Girma', 'Haile', 'Lelisa', 'Mulugeta',
  'Nuru', 'Obang', 'Roba', 'Solomon', 'Taye', 'Yohaness', 'Zelalem',
  'Abdi', 'Bonsa', 'Chali', 'Dawud', 'Ejegu', 'Fikadu', 'Gadafa', 'Hordofa',
]

const firstNamesF = [
  'Aster', 'Birtukan', 'Chaltu', 'Diribe', 'Ejigayehu', 'Fatuma', 'Genet',
  'Hawi', 'Ibsit', 'Jamila', 'Kabedaa', 'Lomi', 'Marta', 'Nardos',
  'Obse', 'Rabia', 'Saba', 'Tigist', 'Ukume', 'Wubit', 'Yeshi', 'Zebiba',
]

const lastNames = [
  'Bekele', 'Tesfaye', 'Gemechu', 'Hailu', 'Tola', 'Dibaba', 'Roba',
  'Lelisa', 'Bulcha', 'Chala', 'Debela', 'Negassa', 'Olana', 'Wako',
  'Yadesa', 'Boruu', 'Gammada', 'Hinsermu', 'Iddo', 'Jawar',
]

// Oromia regions / zones
const regions = [
  'Oromia - East Shewa',
  'Oromia - West Shewa',
  'Oromia - Arsi',
  'Oromia - Bale',
  'Oromia - Jimma',
  'Oromia - Illubabor',
  'Oromia - Hararghe',
  'Oromia - Borana',
  'Oromia - Wellega',
  'Addis Ababa',
  'Dire Dawa',
  'Amhara',
  'SNNP',
]

// Deterministic pseudo-random for reproducible seed
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const rand = seededRandom(42)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function randomDateOfBirth(): string {
  // 1955-2005
  const year = 1955 + Math.floor(rand() * 50)
  const month = 1 + Math.floor(rand() * 12)
  const day = 1 + Math.floor(rand() * 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function randomIssueDate(): string {
  // 2018-2024
  const year = 2018 + Math.floor(rand() * 7)
  const month = 1 + Math.floor(rand() * 12)
  const day = 1 + Math.floor(rand() * 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function randomIdNumber(): string {
  // 16-digit Ethiopian-style ID
  let s = ''
  for (let i = 0; i < 16; i++) {
    s += String(Math.floor(rand() * 10))
  }
  return s
}

// Generate 200 visitors
export const mockVisitors: VisitorRecord[] = []
for (let i = 0; i < 200; i++) {
  const gender: 'M' | 'F' = rand() < 0.5 ? 'M' : 'F'
  const first = gender === 'M' ? pick(firstNamesM) : pick(firstNamesF)
  const last = pick(lastNames)
  // Avoid duplicate IDs by retrying
  let id = randomIdNumber()
  while (mockVisitors.some((v) => v.id === id)) {
    id = randomIdNumber()
  }
  mockVisitors.push({
    id,
    fullName: `${first} ${last}`,
    dateOfBirth: randomDateOfBirth(),
    gender,
    region: pick(regions),
    issuedAt: randomIssueDate(),
    createdAt: new Date(),
  })
}

// Blocklist: pick 5 random visitors to flag
export const mockBlocklist: BlocklistEntryRecord[] = []
const blocklistReasons = [
  { reason: 'Outstanding arrest warrant — security concern', severity: 'HIGH' as const },
  { reason: 'Previously trespassed at festival site', severity: 'MEDIUM' as const },
  { reason: 'Flagged for ID verification follow-up', severity: 'LOW' as const },
  { reason: 'Reported stolen ID — verify identity', severity: 'HIGH' as const },
  { reason: 'Lost person — reunite with family at Tent 3', severity: 'MEDIUM' as const },
]
for (let i = 0; i < 5; i++) {
  const v = mockVisitors[i * 17]
  mockBlocklist.push({
    visitorId: v.id,
    reason: blocklistReasons[i].reason,
    severity: blocklistReasons[i].severity,
    addedBy: 'admin',
  })
}
