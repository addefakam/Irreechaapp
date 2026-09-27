'use client'

import dynamic from 'next/dynamic'
import { ServiceWorkerRegister } from '@/components/gate-guard/sw-register'

const AppShell = dynamic(
  () => import('@/components/gate-guard/app-shell').then((m) => m.AppShell),
  { ssr: false },
)

export default function Home() {
  return (
    <>
      <ServiceWorkerRegister />
      <AppShell />
    </>
  )
}
