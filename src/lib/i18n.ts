// Irreecha GateGuard — Bilingual labels (English + Afaan Oromoo)
// All UI text keys with their translations.

export type Language = 'en' | 'or'

export type TranslationKey = keyof typeof translations.en

export const translations = {
  en: {
    // App meta
    appName: 'Irreecha GateGuard',
    appTagline: 'Visitor ID Scanner & Security',
    language: 'Language',
    english: 'English',
    afaanOromoo: 'Afaan Oromoo',

    // Login
    loginTitle: 'Gate Operator Login',
    loginSubtitle: 'Select your gate and enter your 4-digit PIN',
    selectGate: 'Select Gate',
    enterPin: 'Enter 4-digit PIN',
    pin: 'PIN',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    invalidPin: 'PIN must be 4 digits',
    loginFailed: 'Login failed. Please try again.',
    demoHint: 'Demo PINs: 1001, 1002, 1003, 1004',

    // Nav
    navScanner: 'Scanner',
    navDashboard: 'Dashboard',
    navAnalytics: 'Analytics',
    navBlocklist: 'Blocklist',
    navSync: 'Sync',
    signOut: 'Sign Out',

    // Scanner
    scannerTitle: 'Scan National ID',
    scannerSubtitle: 'Point camera at the QR code on the visitor\'s ID',
    startCamera: 'Start Camera',
    stopCamera: 'Stop Camera',
    cameraStarting: 'Starting camera...',
    cameraError: 'Camera access denied. Check browser permissions.',
    cameraNotSupported: 'Camera scanning not supported on this device. Use manual entry.',
    manualEntry: 'Manual Entry',
    manualEntryHint: 'Enter the 16-digit national ID number',
    enterIdNumber: 'National ID Number',
    submitManual: 'Look Up Visitor',
    scanAnother: 'Scan Another',
    noCameraAccess: 'No camera access',

    // Scan results
    admitted: 'ADMITTED',
    admittedDesc: 'Visitor cleared to enter',
    blocked: 'BLOCKED',
    blockedDesc: 'Visitor flagged — do not allow entry',
    reentryWarn: 'RE-ENTRY WARNING',
    reentryWarnDesc: 'Same ID scanned within 4 hours',
    visitorNotFound: 'Visitor not in registry',
    visitorNotFoundDesc: 'ID not recognized. Verify manually.',
    visitor: 'Visitor',
    nationalId: 'National ID',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    region: 'Region',
    issuedOn: 'Issued On',
    blocklistReason: 'Blocklist Reason',
    severity: 'Severity',
    scanTime: 'Scan Time',
    lastScanned: 'Last Scanned',
    close: 'Close',
    continueAnyway: 'Override & Allow',
    callSecurity: 'Call Security',

    // Dashboard
    dashboardTitle: 'Gate Dashboard',
    todayCount: 'Today\'s Count',
    admittedToday: 'Admitted Today',
    blockedToday: 'Blocked Today',
    capacityUsed: 'Capacity Used',
    recentScans: 'Recent Scans',
    noRecentScans: 'No scans yet today',
    viewAll: 'View All',
    pendingSync: 'Pending Sync',
    lastSync: 'Last Sync',
    syncNow: 'Sync Now',
    syncSuccess: 'Synced successfully',
    syncFailed: 'Sync failed — will retry',
    online: 'Online',
    offline: 'Offline',
    syncing: 'Syncing...',
    neverSynced: 'Never synced',

    // Analytics
    analyticsTitle: 'Arrival Analytics',
    analyticsSubtitle: 'Historical data for future Irreecha preparation',
    arrivalsByHour: 'Arrivals by Hour',
    arrivalsByGate: 'Arrivals by Gate',
    dayOverDay: 'Day-over-Day Comparison',
    busiestHour: 'Busiest Hour',
    busiestGate: 'Busiest Gate',
    totalArrivals: 'Total Arrivals',
    avgPerHour: 'Avg per Hour',
    allGates: 'All Gates',
    selectDay: 'Select Day',
    today: 'Today',
    yesterday: 'Yesterday',
    dayMinus2: '2 days ago',
    dayMinus3: '3 days ago',
    arrivals: 'Arrivals',
    hour: 'Hour',
    gate: 'Gate',
    noData: 'No data for selected range',

    // Blocklist
    blocklistTitle: 'Blocklist / Watchlist',
    blocklistSubtitle: 'Flagged visitors trigger instant red alert at gates',
    blocklistEmpty: 'No flagged visitors',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',

    // Sync status
    syncStatusOnline: 'Connected to center',
    syncStatusOffline: 'Offline — scans cached locally',
    pendingScans: '{count} scans waiting to sync',
    scansSynced: '{count} scans synced to center',

    // Common
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    yes: 'Yes',
    no: 'No',
    back: 'Back',
    next: 'Next',

    // Footer
    footerText: 'Irreecha GateGuard — Bishoftu, Oromia',
  },

  or: {
    // App meta
    appName: 'Irreecha GateGuard',
    appTagline: 'Sukaaksa Ida\'aa Dhiyaataa fi Nagumaa',
    language: 'Afaan',
    english: 'Afaan Ingiliffaa',
    afaanOromoo: 'Afaan Oromoo',

    // Login
    loginTitle: 'Seensa Hojisaa Gaalaa',
    loginSubtitle: 'Gaalaa kee filadhu fi PIN diigital 4 galchi',
    selectGate: 'Gaala fili',
    enterPin: 'PIN diigital 4 galchi',
    pin: 'PIN',
    signIn: 'Seeni',
    signingIn: 'Seenyaa jira...',
    invalidPin: 'PIN diigital 4 ta\'uu qaba',
    loginFailed: 'Seensa hin milkoofne. Irra deebi\'i yaali.',
    demoHint: 'PIN dorgommii: 1001, 1002, 1003, 1004',

    // Nav
    navScanner: 'Sukaaksa',
    navDashboard: 'Saakhaalee',
    navAnalytics: 'Qorannoo',
    navBlocklist: 'Galmee Cufamaa',
    navSync: 'Walitti-fufi',
    signOut: 'Ba\'i',

    // Scanner
    scannerTitle: 'Ida\'aa Biyyaalessaa Sukaaksi',
    scannerSubtitle: 'Kaameraa gara koodii QR kan kaardii idaa dhiyaataaitti qajeessi',
    startCamera: 'Kaameraa Egali',
    stopCamera: 'Kaameraa Dhaqi',
    cameraStarting: 'Kaameraa eegalee jira...',
    cameraError: 'Foyya\'iinsi kaameraa hin kennamne. Rabsa biraawzarii ilaali.',
    cameraNotSupported: 'Sukaaksa kaameraa kana irrati hin deggeru. Galchii harkaa fayyadami.',
    manualEntry: 'Galchii Harkaa',
    manualEntryHint: 'Lakkoofsa idaa biyyaalessaa diigitaal 16 galchi',
    enterIdNumber: 'Lakkoofsa Ida\'aa Biyyaalessaa',
    submitManual: 'Dhiyaataa Barbaadi',
    scanAnother: 'Bira Sukaaksi',
    noCameraAccess: 'Foyya\'iinsi kaameraa hin jiru',

    // Scan results
    admitted: 'SEENYAMEERA',
    admittedDesc: 'Dhiyaatai seeni akka danda\'u mirkaneessameera',
    blocked: 'CUFAMEERA',
    blockedDesc: 'Dhiyaatai sagaleffameera — hin dabarsifamu',
    reentryWarn: 'Sukeffannaa Galmii',
    reentryWarnDesc: 'ID walfakkaataan sa\'a 4 keessatti suukaaksameera',
    visitorNotFound: 'Dhiyaatai galmeessaa hin jiru',
    visitorNotFoundDesc: 'ID hin beekamne. Harkaan mirkeessiti.',
    visitor: 'Dhiyaataa',
    nationalId: 'Lakkoofsa Ida\'aa Biyyaalessaa',
    dateOfBirth: 'Guyuu Dhalootaa',
    gender: 'Saala',
    region: 'Godina',
    issuedOn: 'Guyuu Eegumsaa',
    blocklistReason: 'Sababa Cufamaa',
    severity: 'Ulfaallina',
    scanTime: 'Yeroo Sukaaksaa',
    lastScanned: 'Sukaaksaa Darbe',
    close: 'Cufi',
    continueAnyway: 'Dabarsi',
    callSecurity: 'Nagumaa Waami',

    // Dashboard
    dashboardTitle: 'Saakhaalee Gaalaa',
    todayCount: 'Lakkoofsa Har\'aa',
    admittedToday: 'Seenye Har\'aa',
    blockedToday: 'Cufame Har\'aa',
    capacityUsed: 'Aangoo Badhate',
    recentScans: 'Sukaaksaa Dhumaa',
    noRecentScans: 'Har\'aa sukaaksaa hin jiru',
    viewAll: 'Hunda Ilali',
    pendingSync: 'Walitti-fufi Eeggame',
    lastSync: 'Walitti-fufi Dhumaa',
    syncNow: 'Har\'a Walitti-fufi',
    syncSuccess: 'Milkaa\'uun walitti-fufe',
    syncFailed: 'Hin milkoofne — irradeebi',
    online: 'Qabxii tarkaanfachiisaa',
    offline: 'Kan hin qabne',
    syncing: 'Walitti-fufi jira...',
    neverSynced: 'Malkaa walitti-fufee',

    // Analytics
    analyticsTitle: 'Qorannoo Dhuufaatii',
    analyticsSubtitle: 'Daataa darbe kanaaf oggomsa Irreecha fuulduraa',
    arrivalsByHour: 'Dhuufaataa Sa\'aatiin',
    arrivalsByGate: 'Dhuufaataa Galaan',
    dayOverDay: 'Waldaba Guyuu-Guyuu',
    busiestHour: 'Sa\'aati Bal\'inaa',
    busiestGate: 'Gaala Bal\'inaa',
    totalArrivals: 'Dhuufaataa Wal-makaa',
    avgPerHour: 'Giddu-galeessa Sa\'aatiitti',
    allGates: 'Gaala Hunda',
    selectDay: 'Guyuu Fili',
    today: 'Har\'a',
    yesterday: 'Kel-galii',
    dayMinus2: 'Lama darbe',
    dayMinus3: 'Saddex darbe',
    arrivals: 'Dhuufaataa',
    hour: 'Sa\'aati',
    gate: 'Gaala',
    noData: 'Gabaasa filatamerratti daataa hin jiru',

    // Blocklist
    blocklistTitle: 'Galmee Cufamaa / Saaaaressaa',
    blocklistSubtitle: 'Dhiyaataa sagaleffamtootni rakkoo diima\'aa sa\'aatiitti uuma',
    blocklistEmpty: 'Dhiyaataa sagaleffamtoot hin jiru',
    high: 'SA\'A ULFAA',
    medium: 'GIDDU-GALEESSA',
    low: 'GAD-AANA',

    // Sync status
    syncStatusOnline: 'Wiirtuu walitti qabameera',
    syncStatusOffline: 'Offline — sukaaksaa kutaan qabameera',
    pendingScans: 'Sukaaksaa {count} walitti-fufi eeggata',
    scansSynced: 'Sukaaksaa {count} wiirtuutti ergameera',

    // Common
    loading: 'Fe\'uu jira...',
    error: 'Dogoggora',
    retry: 'Irra-deebi\'i',
    cancel: 'Haqi',
    confirm: 'Mirkiloofti',
    save: 'Ol-kayisi',
    yes: 'Eeyyee',
    no: 'Lakki',
    back: 'Deebi\'',
    next: 'Itti-aana',

    // Footer
    footerText: 'Irreecha GateGuard — Bishoftuu, Oromiyaa',
  },
} as const

export function t(lang: Language, key: TranslationKey, params?: Record<string, string | number>): string {
  let s: string = translations[lang][key] ?? translations.en[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(`{${k}}`, String(v))
    }
  }
  return s
}
