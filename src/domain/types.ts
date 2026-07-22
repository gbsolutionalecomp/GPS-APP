export type UserRole = 'admin' | 'engineer'
export type JourneySource = 'planned' | 'locatelia_api' | 'locatelia_webhook' | 'locatelia_import'
export type JourneyLifecycle = 'scheduled' | 'active' | 'finished'
export type JourneyWorkflow = 'assigned' | 'unassigned' | 'pending_evidence' | 'complete'
export type EvidenceKind = 'before' | 'after'

export interface Profile {
  id: string
  fullName: string
  email: string
  role: UserRole
  active: boolean
}

export interface Project {
  id: string
  code: string
  name: string
  active: boolean
}

export interface Vehicle {
  id: string
  plate: string
  name: string
  locateliaDeviceId?: string
  active: boolean
}

export interface JourneyStop {
  id: string
  journeyId: string
  sequence: number
  arrivedAt: string
  departedAt?: string
  location: string
  durationMinutes: number
}

export interface OdometerEvidence {
  id: string
  journeyId: string
  kind: EvidenceKind
  readingKm: number
  photoUrl: string
  storagePath?: string
  uploadedBy: string
  uploadedAt: string
  byteSize?: number
  mimeType?: string
  widthPx?: number
  heightPx?: number
  sha256?: string
}

export interface Journey {
  id: string
  externalId?: string
  fingerprint?: string
  source: JourneySource
  vehicleId: string
  projectId?: string
  engineerId?: string
  plannedStart?: string
  plannedEnd?: string
  actualStart?: string
  actualEnd?: string
  origin?: string
  destination?: string
  gpsDistanceKm?: number
  sourceUpdatedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SyncRun {
  id: string
  source: JourneySource
  status: 'success' | 'warning' | 'error' | 'running'
  startedAt: string
  finishedAt?: string
  received: number
  inserted: number
  updated: number
  errorMessage?: string
}

export interface IntegrationSettings {
  mode: 'disabled' | 'api' | 'webhook' | 'import'
  lastSyncedAt?: string
  lastSuccessfulAt?: string
  pollIntervalMinutes: number
}

export interface AppSnapshot {
  currentUser: Profile
  profiles: Profile[]
  projects: Project[]
  vehicles: Vehicle[]
  journeys: Journey[]
  stops: JourneyStop[]
  evidence: OdometerEvidence[]
  syncRuns: SyncRun[]
  integration: IntegrationSettings
}

export interface JourneySegment {
  id: string
  journeyId: string
  sequence: number
  origin: string
  destination: string
  startedAt?: string
  endedAt?: string
}
