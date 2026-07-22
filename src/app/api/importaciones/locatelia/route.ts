import { NextResponse } from 'next/server'
import { getAppSnapshot } from '@/data/server-snapshot'
import type { Journey, JourneyStop } from '@/domain/types'
import { parseLocateliaFile } from '@/features/imports/locatelia-file'
import { DefaultLocateliaAdapter } from '@/integrations/locatelia/adapter'
import { authorizeAdmin } from '@/lib/authorization'
import { getDataMode } from '@/lib/env'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function persistJourney(journey: Journey, stops: JourneyStop[]): Promise<'inserted' | 'updated'> {
  const supabase = await getSupabaseServerClient()
  const planned = await supabase.from('journeys').select('id').eq('vehicle_id', journey.vehicleId).is('actual_start', null).lte('planned_start', journey.actualEnd ?? journey.actualStart!).gte('planned_end', journey.actualStart!).limit(2)
  let targetId = journey.id
  if ((planned.data?.length ?? 0) === 1) targetId = planned.data![0]!.id
  if (targetId === journey.id) {
    const keyQuery = journey.externalId ? supabase.from('journeys').select('id').eq('external_id', journey.externalId) : supabase.from('journeys').select('id').eq('fingerprint', journey.fingerprint!)
    const existing = await keyQuery.maybeSingle()
    if (existing.data?.id) targetId = existing.data.id
  }
  const values = {
    id: targetId, external_id: journey.externalId, fingerprint: journey.fingerprint, source: journey.source, vehicle_id: journey.vehicleId,
    actual_start: journey.actualStart, actual_end: journey.actualEnd, origin: journey.origin, destination: journey.destination,
    gps_distance_km: journey.gpsDistanceKm, source_updated_at: journey.sourceUpdatedAt,
  }
  const { error } = await supabase.from('journeys').upsert(values, { onConflict: 'id' })
  if (error) throw error
  if (stops.length) {
    const stopRows = stops.map((stop) => ({ journey_id: targetId, sequence: stop.sequence, arrived_at: stop.arrivedAt, departed_at: stop.departedAt, location: stop.location, duration_minutes: stop.durationMinutes }))
    const result = await supabase.from('journey_stops').upsert(stopRows, { onConflict: 'journey_id,sequence' })
    if (result.error) throw result.error
  }
  return targetId === journey.id ? 'inserted' : 'updated'
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin()
  if (!authorization.ok) return authorization.response
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: 'Selecciona un archivo.' }, { status: 400 })
    const snapshot = await getAppSnapshot()
    const records = await parseLocateliaFile(file)
    const normalized = await new DefaultLocateliaAdapter().normalize(records, { vehicles: snapshot.vehicles })
    let inserted = 0; let updated = 0
    if (getDataMode() === 'supabase') {
      for (const journey of normalized.journeys) {
        const result = await persistJourney(journey, normalized.stops.filter((stop) => stop.journeyId === journey.id))
        if (result === 'inserted') inserted += 1; else updated += 1
      }
      const supabase = await getSupabaseServerClient()
      await supabase.from('import_batches').insert({ provider: 'locatelia', file_name: file.name, row_count: records.length, accepted_count: normalized.journeys.length, rejected_count: normalized.errors.length, imported_by: authorization.userId })
    }
    return NextResponse.json({ fileName: file.name, acceptedRows: normalized.journeys.length, rejectedRows: normalized.errors.length, warnings: normalized.warnings, errors: normalized.errors.slice(0, 100), journeys: normalized.journeys, stops: normalized.stops, inserted, updated, committed: getDataMode() === 'supabase' })
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'No fue posible importar el archivo.' }, { status: 422 })
  }
}
