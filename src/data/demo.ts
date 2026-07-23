import type { AppSnapshot } from '@/domain/types'


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

