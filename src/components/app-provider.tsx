'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppSnapshot, Journey, JourneyStop, OdometerEvidence, Profile, Project, UserRole, Vehicle } from '@/domain/types'
import type { DataMode } from '@/lib/env'
import { readImageMetadata } from '@/lib/media/image-metadata'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const DEMO_KEY = 'gbs-gps-demo-v4'
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const ACCEPTED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export interface CreateJourneyInput {
  vehicleId: string
  projectId: string
  engineerId: string
  plannedStart: string
  plannedEnd: string
  origin: string
  destination: string
}

export interface EvidenceInput {
  journeyId: string
  kind: 'before' | 'after'
  readingKm: number
  file: File
}

interface AppContextValue {
  mode: DataMode
  snapshot: AppSnapshot
  busy: boolean
  error?: string
  setDemoRole: (role: UserRole) => void
  createJourney: (input: CreateJourneyInput) => Promise<void>
  assignJourney: (journeyId: string, projectId: string, engineerId: string) => Promise<void>
  saveEvidence: (input: EvidenceInput) => Promise<void>
  addImportedJourneys: (journeys: Journey[], stops?: JourneyStop[]) => void
  addProject: (code: string, name: string) => Promise<void>
  addVehicle: (plate: string, name: string, deviceId: string) => Promise<void>
  inviteEngineer: (fullName: string, email: string) => Promise<void>
  refresh: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

function fileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(new Error('No fue posible leer la fotografía.')))
    reader.readAsDataURL(file)
  })
}

function validateEvidence(input: EvidenceInput, snapshot: AppSnapshot): void {
  if (!Number.isFinite(input.readingKm) || input.readingKm < 0) throw new Error('La lectura debe ser un número positivo.')
  if (!ACCEPTED_PHOTO_TYPES.has(input.file.type)) throw new Error('La fotografía debe ser JPG, PNG o WebP.')
  if (input.file.size > MAX_PHOTO_BYTES) throw new Error('La fotografía supera el límite de 10 MB.')
  if (input.kind === 'after') {
    const before = snapshot.evidence.find((item) => item.journeyId === input.journeyId && item.kind === 'before')
    if (before && input.readingKm < before.readingKm) throw new Error('El odómetro final no puede ser menor al inicial.')
  }
}

export function AppProvider({ initialSnapshot, mode, children }: { initialSnapshot: AppSnapshot; mode: DataMode; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(() => {
    if (mode !== 'demo' || typeof window === 'undefined') return initialSnapshot
    try { return JSON.parse(window.localStorage.getItem(DEMO_KEY) ?? '') as AppSnapshot } catch { return initialSnapshot }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (mode === 'demo') window.localStorage.setItem(DEMO_KEY, JSON.stringify(snapshot))
  }, [mode, snapshot])

  const refresh = useCallback(async () => {
    if (mode === 'demo') return
    const response = await fetch('/api/snapshot', { cache: 'no-store' })
    if (!response.ok) throw new Error('No fue posible actualizar los viajes.')
    setSnapshot(await response.json() as AppSnapshot)
  }, [mode])

  useEffect(() => {
    if (mode !== 'supabase') return
    const supabase = getSupabaseBrowserClient()
    let timer: ReturnType<typeof setTimeout> | undefined
    const channel = supabase.channel('gps-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journeys' }, () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 250) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journey_stops' }, () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 250) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'odometer_evidence' }, () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 250) })
      .subscribe()
    return () => { clearTimeout(timer); void supabase.removeChannel(channel) }
  }, [mode, refresh])

  const run = useCallback(async (operation: () => Promise<void>) => {
    setBusy(true); setError(undefined)
    try { await operation() } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.'
      setError(message)
      throw cause
    } finally { setBusy(false) }
  }, [])

  const setDemoRole = useCallback((role: UserRole) => {
    if (mode !== 'demo') return
    setSnapshot((current) => ({ ...current, currentUser: current.profiles.find((profile) => profile.role === role && profile.active) ?? current.currentUser }))
  }, [mode])

  const createJourney = useCallback(async (input: CreateJourneyInput) => run(async () => {
    const now = new Date().toISOString()
    if (new Date(input.plannedEnd) <= new Date(input.plannedStart)) throw new Error('El fin planeado debe ser posterior al inicio.')
    const journey: Journey = {
      id: crypto.randomUUID(), source: 'planned', vehicleId: input.vehicleId, projectId: input.projectId, engineerId: input.engineerId,
      plannedStart: new Date(input.plannedStart).toISOString(), plannedEnd: new Date(input.plannedEnd).toISOString(),
      origin: input.origin.trim(), destination: input.destination.trim(), createdAt: now, updatedAt: now,
    }
    if (mode === 'demo') {
      setSnapshot((current) => ({ ...current, journeys: [journey, ...current.journeys] }))
      return
    }
    const { error: insertError } = await getSupabaseBrowserClient().from('journeys').insert({
      id: journey.id, source: journey.source, vehicle_id: journey.vehicleId, project_id: journey.projectId, engineer_id: journey.engineerId,
      planned_start: journey.plannedStart, planned_end: journey.plannedEnd, origin: journey.origin, destination: journey.destination,
    })
    if (insertError) throw insertError
    await refresh()
  }), [mode, refresh, run])

  const assignJourney = useCallback(async (journeyId: string, projectId: string, engineerId: string) => run(async () => {
    if (mode === 'demo') {
      setSnapshot((current) => ({ ...current, journeys: current.journeys.map((journey) => journey.id === journeyId ? { ...journey, projectId, engineerId, updatedAt: new Date().toISOString() } : journey) }))
      return
    }
    const response = await fetch(`/api/viajes/${journeyId}/asignacion`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ projectId, engineerId }) })
    if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? 'No fue posible asignar el viaje.')
    await refresh()
  }), [mode, refresh, run])

  const saveEvidence = useCallback(async (input: EvidenceInput) => run(async () => {
    validateEvidence(input, snapshot)
    const now = new Date().toISOString()
    if (mode === 'demo') {
      const photoUrl = await fileAsDataUrl(input.file)
      const evidence: OdometerEvidence = { id: crypto.randomUUID(), journeyId: input.journeyId, kind: input.kind, readingKm: input.readingKm, photoUrl, uploadedBy: snapshot.currentUser.id, uploadedAt: now }
      setSnapshot((current) => ({ ...current, evidence: [...current.evidence.filter((item) => item.journeyId !== input.journeyId || item.kind !== input.kind), evidence] }))
      return
    }
    const supabase = getSupabaseBrowserClient()
    const extension = input.file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const storagePath = `${input.journeyId}/${input.kind}-${crypto.randomUUID()}.${extension}`
    const metadata = await readImageMetadata(input.file)
    const upload = await supabase.storage.from('odometer-evidence').upload(storagePath, input.file, { cacheControl: '3600', contentType: input.file.type, upsert: false })
    if (upload.error) throw upload.error
    const { error: evidenceError } = await supabase.from('odometer_evidence').upsert({
      journey_id: input.journeyId, kind: input.kind, reading_km: input.readingKm, storage_path: storagePath, uploaded_by: snapshot.currentUser.id,
      byte_size: metadata.byteSize, mime_type: metadata.mimeType, width_px: metadata.widthPx, height_px: metadata.heightPx, sha256: metadata.sha256,
    }, { onConflict: 'journey_id,kind' })
    if (evidenceError) throw evidenceError
    await refresh()
  }), [mode, refresh, run, snapshot])

  const addImportedJourneys = useCallback((journeys: Journey[], stops: JourneyStop[] = []) => {
    if (mode !== 'demo') { void refresh(); return }
    setSnapshot((current) => {
      const keys = new Set(current.journeys.flatMap((item) => [item.externalId, item.fingerprint].filter(Boolean)))
      const accepted = journeys.filter((item) => !keys.has(item.externalId) && !keys.has(item.fingerprint))
      const acceptedIds = new Set(accepted.map((item) => item.id))
      return { ...current, journeys: [...accepted, ...current.journeys], stops: [...stops.filter((item) => acceptedIds.has(item.journeyId)), ...current.stops] }
    })
  }, [mode, refresh])

  const addProject = useCallback(async (code: string, name: string) => run(async () => {
    const project: Project = { id: crypto.randomUUID(), code: code.trim().toUpperCase(), name: name.trim(), active: true }
    if (!project.code || !project.name) throw new Error('Código y nombre son obligatorios.')
    if (mode === 'demo') { setSnapshot((current) => ({ ...current, projects: [...current.projects, project] })); return }
    const { error: insertError } = await getSupabaseBrowserClient().from('projects').insert({ id: project.id, code: project.code, name: project.name })
    if (insertError) throw insertError
    await refresh()
  }), [mode, refresh, run])

  const addVehicle = useCallback(async (plate: string, name: string, deviceId: string) => run(async () => {
    const vehicle: Vehicle = { id: crypto.randomUUID(), plate: plate.trim().toUpperCase(), name: name.trim(), locateliaDeviceId: deviceId.trim() || undefined, active: true }
    if (!vehicle.plate || !vehicle.name) throw new Error('Placa y nombre son obligatorios.')
    if (mode === 'demo') { setSnapshot((current) => ({ ...current, vehicles: [...current.vehicles, vehicle] })); return }
    const { error: insertError } = await getSupabaseBrowserClient().from('vehicles').insert({ id: vehicle.id, plate: vehicle.plate, name: vehicle.name, locatelia_device_id: vehicle.locateliaDeviceId })
    if (insertError) throw insertError
    await refresh()
  }), [mode, refresh, run])

  const inviteEngineer = useCallback(async (fullName: string, email: string) => run(async () => {
    if (!fullName.trim() || !email.includes('@')) throw new Error('Nombre y correo válido son obligatorios.')
    if (mode === 'demo') {
      const profile: Profile = { id: crypto.randomUUID(), fullName: fullName.trim(), email: email.trim().toLowerCase(), role: 'engineer', active: true }
      setSnapshot((current) => ({ ...current, profiles: [...current.profiles, profile] }))
      return
    }
    const response = await fetch('/api/admin/usuarios', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName, email }) })
    if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? 'No fue posible invitar al ingeniero.')
    await refresh()
  }), [mode, refresh, run])

  const value = useMemo<AppContextValue>(() => ({
    mode, snapshot, busy, error, setDemoRole, createJourney, assignJourney, saveEvidence,
    addImportedJourneys, addProject, addVehicle, inviteEngineer, refresh,
  }), [mode, snapshot, busy, error, setDemoRole, createJourney, assignJourney, saveEvidence, addImportedJourneys, addProject, addVehicle, inviteEngineer, refresh])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp debe usarse dentro de AppProvider.')
  return value
}
