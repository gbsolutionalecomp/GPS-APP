import { demoSnapshot } from '@/data/demo'
import type { AppSnapshot, Journey, JourneyStop, OdometerEvidence, Profile, Project, SyncRun, Vehicle } from '@/domain/types'
import { getDataMode } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

type Row = Record<string, unknown>
type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServerClient>>

const EVIDENCE_SIGNED_URL_TTL_SECONDS = 3600

const text = (value: unknown) => String(value ?? '')
const maybeText = (value: unknown) => value ? String(value) : undefined
const numberValue = (value: unknown) => value === null || value === undefined ? undefined : Number(value)

function mapProfile(row: Row): Profile {
  return { id: text(row.id), fullName: text(row.full_name), email: text(row.email), role: row.role === 'engineer' ? 'engineer' : 'admin', active: Boolean(row.active) }
}

function mapProject(row: Row): Project {
  return { id: text(row.id), code: text(row.code), name: text(row.name), active: Boolean(row.active) }
}

function mapVehicle(row: Row): Vehicle {
  return { id: text(row.id), plate: text(row.plate), name: text(row.name), locateliaDeviceId: maybeText(row.locatelia_device_id), active: Boolean(row.active) }
}

function mapJourney(row: Row): Journey {
  return {
    id: text(row.id), externalId: maybeText(row.external_id), fingerprint: maybeText(row.fingerprint),
    source: row.source as Journey['source'], vehicleId: text(row.vehicle_id), projectId: maybeText(row.project_id), engineerId: maybeText(row.engineer_id),
    plannedStart: maybeText(row.planned_start), plannedEnd: maybeText(row.planned_end), actualStart: maybeText(row.actual_start), actualEnd: maybeText(row.actual_end),
    origin: maybeText(row.origin), destination: maybeText(row.destination), gpsDistanceKm: numberValue(row.gps_distance_km), sourceUpdatedAt: maybeText(row.source_updated_at),
    createdAt: text(row.created_at), updatedAt: text(row.updated_at),
  }
}

function mapStop(row: Row): JourneyStop {
  return { id: text(row.id), journeyId: text(row.journey_id), sequence: Number(row.sequence), arrivedAt: text(row.arrived_at), departedAt: maybeText(row.departed_at), location: text(row.location), durationMinutes: Number(row.duration_minutes) }
}

async function mapEvidenceRows(supabase: any, rows: Row[]): Promise<OdometerEvidence[]> {
  const paths = [...new Set(rows.map((row) => text(row.storage_path)).filter(Boolean))]
  const signed = paths.length
    ? await supabase.storage.from('odometer-evidence').createSignedUrls(paths, EVIDENCE_SIGNED_URL_TTL_SECONDS)
    : { data: null }
  const urlByPath = new Map<string, string>(((signed as any).data ?? []).filter((item: any) => item.signedUrl && !item.error).map((item: any) => [item.path, item.signedUrl as string]))
  return rows.map((row) => {
    const id = text(row.id)
    const storagePath = text(row.storage_path)
    return {
      id, journeyId: text(row.journey_id), kind: row.kind as OdometerEvidence['kind'], readingKm: Number(row.reading_km),
      photoUrl: urlByPath.get(storagePath) ?? `/api/evidencias/${id}/foto`,
      storagePath, uploadedBy: text(row.uploaded_by), uploadedAt: text(row.uploaded_at),
      byteSize: numberValue(row.byte_size), mimeType: maybeText(row.mime_type),
      widthPx: numberValue(row.width_px), heightPx: numberValue(row.height_px), sha256: maybeText(row.sha256),
    }
  })
}

function mapSyncRun(row: Row): SyncRun {
  return { id: text(row.id), source: row.source as SyncRun['source'], status: row.status as SyncRun['status'], startedAt: text(row.started_at), finishedAt: maybeText(row.finished_at), received: Number(row.received), inserted: Number(row.inserted), updated: Number(row.updated), errorMessage: maybeText(row.error_message) }
}

export async function getAppSnapshot(): Promise<AppSnapshot> {
  if (getDataMode() === 'demo') return structuredClone(demoSnapshot)
  const supabase = await getSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  const [profiles, projects, vehicles, journeys, stops, evidence, syncRuns, integration] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('projects').select('*').order('code'),
    supabase.from('vehicles').select('*').order('plate'),
    supabase.from('journeys').select('*').order('actual_start', { ascending: false, nullsFirst: false }).order('planned_start', { ascending: false, nullsFirst: false }),
    supabase.from('journey_stops').select('*').order('sequence'),
    supabase.from('odometer_evidence').select('*').order('uploaded_at'),
    supabase.from('sync_runs').select('*').order('started_at', { ascending: false }).limit(20),
    supabase.from('integration_settings').select('*').eq('provider', 'locatelia').maybeSingle(),
  ])
  const failures = [profiles, projects, vehicles, journeys, stops, evidence, syncRuns].filter((result) => result.error)
  if (failures.length) throw new Error(failures.map((result) => result.error?.message).join('; '))
  const mappedProfiles = (profiles.data ?? []).map((row) => mapProfile(row as Row))
  const userId = auth.user?.id
  const currentUser = (userId ? mappedProfiles.find((profile) => profile.id === userId) : undefined)
    ?? mappedProfiles.find((profile) => profile.role === 'admin')
    ?? { id: userId ?? 'profile-admin', fullName: 'Administrador GBS', email: 'admin@gbs.local', role: 'admin' as const, active: true }
  const integrationRow = integration.data as Row | null
  const mappedEvidence = await mapEvidenceRows(supabase, (evidence.data ?? []) as Row[])
  return {
    currentUser, profiles: mappedProfiles, projects: (projects.data ?? []).map((row) => mapProject(row as Row)),
    vehicles: (vehicles.data ?? []).map((row) => mapVehicle(row as Row)), journeys: (journeys.data ?? []).map((row) => mapJourney(row as Row)),
    stops: (stops.data ?? []).map((row) => mapStop(row as Row)), evidence: mappedEvidence,
    syncRuns: (syncRuns.data ?? []).map((row) => mapSyncRun(row as Row)),
    integration: {
      mode: (integrationRow?.mode as AppSnapshot['integration']['mode']) ?? 'disabled',
      lastSyncedAt: maybeText(integrationRow?.last_synced_at), lastSuccessfulAt: maybeText(integrationRow?.last_successful_at),
      pollIntervalMinutes: Number(integrationRow?.poll_interval_minutes ?? 1),
    },
  }
}
