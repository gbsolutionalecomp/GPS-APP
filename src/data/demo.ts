import type { AppSnapshot } from '@/domain/types'

function odometerPhoto(reading: number, moment: 'INICIO' | 'FINAL'): string {
  const accent = moment === 'INICIO' ? '#0f766e' : '#1d4ed8'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#374151"/></linearGradient></defs><rect width="900" height="560" fill="url(#g)"/><circle cx="450" cy="305" r="185" fill="#0b1220" stroke="#64748b" stroke-width="12"/><path d="M300 390 A180 180 0 0 1 600 390" fill="none" stroke="#94a3b8" stroke-width="15" stroke-dasharray="4 20"/><rect x="288" y="275" width="324" height="92" rx="14" fill="#020617" stroke="#cbd5e1" stroke-width="4"/><text x="450" y="340" text-anchor="middle" font-family="monospace" font-size="60" font-weight="700" fill="#f8fafc">${reading.toLocaleString('es-MX')} km</text><rect x="32" y="30" width="170" height="48" rx="24" fill="${accent}"/><text x="117" y="62" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="white">${moment}</text><text x="450" y="505" text-anchor="middle" font-family="Arial" font-size="22" fill="#cbd5e1">Evidencia demostrativa · Unidad GBS-01</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const demoSnapshot: AppSnapshot = {
  currentUser: {
    id: 'profile-admin',
    fullName: 'Laura Méndez',
    email: 'admin@gbs.local',
    role: 'admin',
    active: true,
  },
  profiles: [
    { id: 'profile-admin', fullName: 'Laura Méndez', email: 'admin@gbs.local', role: 'admin', active: true },
    { id: 'profile-engineer-1', fullName: 'Ing. Carlos Ruiz', email: 'carlos@gbs.local', role: 'engineer', active: true },
    { id: 'profile-engineer-2', fullName: 'Ing. Ana Torres', email: 'ana@gbs.local', role: 'engineer', active: true },
  ],
  projects: [
    { id: 'project-norte', code: 'PRY-026', name: 'Parque Industrial Norte', active: true },
    { id: 'project-centro', code: 'PRY-031', name: 'Torre Centro', active: true },
    { id: 'project-bajio', code: 'PRY-044', name: 'Almacén Bajío', active: true },
  ],
  vehicles: [
    { id: 'vehicle-1', plate: 'RTP-482-A', name: 'Nissan NP300 · GBS-01', locateliaDeviceId: 'LOC-GBS-001', active: true },
    { id: 'vehicle-2', plate: 'SVC-119-B', name: 'Toyota Hilux · GBS-02', locateliaDeviceId: 'LOC-GBS-002', active: true },
  ],
  journeys: [],
  stops: [],
  evidence: [],
  syncRuns: [],
  integration: { mode: 'disabled', pollIntervalMinutes: 1 },
}

