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
  journeys: [
    {
      id: 'journey-active', externalId: 'LOC-20260721-001', source: 'locatelia_api', vehicleId: 'vehicle-1',
      projectId: 'project-norte', engineerId: 'profile-engineer-1', plannedStart: '2026-07-21T13:00:00.000Z',
      plannedEnd: '2026-07-21T19:00:00.000Z', actualStart: '2026-07-21T13:18:00.000Z', origin: 'Oficinas GBS Monterrey',
      gpsDistanceKm: 24.8, sourceUpdatedAt: '2026-07-21T15:42:00.000Z', createdAt: '2026-07-21T12:15:00.000Z', updatedAt: '2026-07-21T15:42:00.000Z',
    },
    {
      id: 'journey-complete', externalId: 'LOC-20260718-014', source: 'locatelia_webhook', vehicleId: 'vehicle-1',
      projectId: 'project-centro', engineerId: 'profile-engineer-1', actualStart: '2026-07-18T14:06:00.000Z',
      actualEnd: '2026-07-18T20:31:00.000Z', origin: 'Oficinas GBS Monterrey', destination: 'Oficinas GBS Monterrey',
      gpsDistanceKm: 86.4, sourceUpdatedAt: '2026-07-18T20:33:00.000Z', createdAt: '2026-07-18T14:06:00.000Z', updatedAt: '2026-07-18T20:40:00.000Z',
    },
    {
      id: 'journey-unassigned', externalId: 'LOC-20260719-018', source: 'locatelia_import', vehicleId: 'vehicle-2',
      actualStart: '2026-07-19T15:12:00.000Z', actualEnd: '2026-07-19T17:04:00.000Z', origin: 'San Pedro Garza García',
      destination: 'Santa Catarina', gpsDistanceKm: 32.1, sourceUpdatedAt: '2026-07-19T17:10:00.000Z',
      createdAt: '2026-07-19T17:10:00.000Z', updatedAt: '2026-07-19T17:10:00.000Z',
    },
    {
      id: 'journey-scheduled', source: 'planned', vehicleId: 'vehicle-2', projectId: 'project-bajio', engineerId: 'profile-engineer-2',
      plannedStart: '2026-07-22T12:30:00.000Z', plannedEnd: '2026-07-22T21:00:00.000Z', origin: 'Oficinas GBS Monterrey',
      destination: 'Almacén Bajío', createdAt: '2026-07-21T14:00:00.000Z', updatedAt: '2026-07-21T14:00:00.000Z',
    },
    {
      id: 'journey-pending', externalId: 'LOC-20260716-009', source: 'locatelia_api', vehicleId: 'vehicle-2',
      projectId: 'project-norte', engineerId: 'profile-engineer-2', actualStart: '2026-07-16T13:42:00.000Z',
      actualEnd: '2026-07-16T18:12:00.000Z', origin: 'Oficinas GBS Monterrey', destination: 'Apodaca', gpsDistanceKm: 58.7,
      sourceUpdatedAt: '2026-07-16T18:15:00.000Z', createdAt: '2026-07-16T13:42:00.000Z', updatedAt: '2026-07-16T18:15:00.000Z',
    },
  ],
  stops: [
    { id: 'stop-1', journeyId: 'journey-active', sequence: 1, arrivedAt: '2026-07-21T14:02:00.000Z', departedAt: '2026-07-21T14:27:00.000Z', location: 'Planta Escobedo', durationMinutes: 25 },
    { id: 'stop-2', journeyId: 'journey-active', sequence: 2, arrivedAt: '2026-07-21T15:05:00.000Z', location: 'Parque Industrial Norte', durationMinutes: 37 },
    { id: 'stop-3', journeyId: 'journey-complete', sequence: 1, arrivedAt: '2026-07-18T15:04:00.000Z', departedAt: '2026-07-18T15:45:00.000Z', location: 'Torre Centro · Acceso principal', durationMinutes: 41 },
    { id: 'stop-4', journeyId: 'journey-complete', sequence: 2, arrivedAt: '2026-07-18T17:20:00.000Z', departedAt: '2026-07-18T18:05:00.000Z', location: 'Proveedor eléctrico San Jerónimo', durationMinutes: 45 },
  ],
  evidence: [
    { id: 'evidence-active-before', journeyId: 'journey-active', kind: 'before', readingKm: 48210, photoUrl: odometerPhoto(48210, 'INICIO'), uploadedBy: 'profile-engineer-1', uploadedAt: '2026-07-21T13:12:00.000Z' },
    { id: 'evidence-complete-before', journeyId: 'journey-complete', kind: 'before', readingKm: 47980, photoUrl: odometerPhoto(47980, 'INICIO'), uploadedBy: 'profile-engineer-1', uploadedAt: '2026-07-18T13:58:00.000Z' },
    { id: 'evidence-complete-after', journeyId: 'journey-complete', kind: 'after', readingKm: 48068, photoUrl: odometerPhoto(48068, 'FINAL'), uploadedBy: 'profile-engineer-1', uploadedAt: '2026-07-18T20:38:00.000Z' },
    { id: 'evidence-scheduled-before', journeyId: 'journey-scheduled', kind: 'before', readingKm: 18742, photoUrl: odometerPhoto(18742, 'INICIO'), uploadedBy: 'profile-engineer-2', uploadedAt: '2026-07-21T14:10:00.000Z' },
    { id: 'evidence-pending-before', journeyId: 'journey-pending', kind: 'before', readingKm: 18560, photoUrl: odometerPhoto(18560, 'INICIO'), uploadedBy: 'profile-engineer-2', uploadedAt: '2026-07-16T13:35:00.000Z' },
  ],
  syncRuns: [
    { id: 'sync-1', source: 'locatelia_api', status: 'success', startedAt: '2026-07-21T15:41:55.000Z', finishedAt: '2026-07-21T15:42:02.000Z', received: 2, inserted: 0, updated: 2 },
    { id: 'sync-2', source: 'locatelia_import', status: 'success', startedAt: '2026-07-19T17:09:00.000Z', finishedAt: '2026-07-19T17:10:00.000Z', received: 4, inserted: 4, updated: 0 },
  ],
  integration: { mode: 'api', lastSyncedAt: '2026-07-21T15:42:02.000Z', lastSuccessfulAt: '2026-07-21T15:42:02.000Z', pollIntervalMinutes: 1 },
}
