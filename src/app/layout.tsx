import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { AppProvider } from '@/components/app-provider'
import { AppShell } from '@/components/app-shell'
import { getAppSnapshot } from '@/data/server-snapshot'
import { getDataMode } from '@/lib/env'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'GBS · Control de viajes y GPS', template: '%s · GBS GPS' },
  description: 'Control institucional de recorridos, paradas y evidencias de odómetro.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#102129' }

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [snapshot, mode] = await Promise.all([getAppSnapshot(), Promise.resolve(getDataMode())])
  return <html lang="es-MX"><body><a className="skip-link" href="#main-content">Saltar al contenido</a><AppProvider initialSnapshot={snapshot} mode={mode}><AppShell>{children}</AppShell></AppProvider></body></html>
}
