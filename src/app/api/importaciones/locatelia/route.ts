import { NextResponse } from 'next/server'
import { getAppSnapshot } from '@/data/server-snapshot'
import type { Journey, JourneyStop } from '@/domain/types'
import { parseLocateliaFile } from '@/features/imports/locatelia-file'
import { DefaultLocateliaAdapter } from '@/integrations/locatelia/adapter'
import { authorizeAdmin } from '@/lib/authorization'
import { getDataMode } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const authorization = await authorizeAdmin()
  if (!authorization.ok) return authorization.response
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: 'Selecciona un archivo.' }, { status: 400 })
    const snapshot = await getAppSnapshot()
    const records = await parseLocateliaFile(file)
    const directory = { vehicles: [...snapshot.vehicles] }
    const normalized = await new DefaultLocateliaAdapter().normalize(records, directory)
    let inserted = 0
    let updated = 0
    if (getDataMode() === 'supabase') {
      const supabase = getSupabaseAdminClient()
      if (directory.vehicles.length) {
        const vehicleRows = directory.vehicles.map((v) => ({
          id: v.id,
          plate: v.plate,
          name: v.name,
          locatelia_device_id: v.locateliaDeviceId,
          active: true,
        }))
        const { error: vErr } = await supabase.from('vehicles').upsert(vehicleRows, { onConflict: 'id' })
        if (vErr) console.warn('Vehicle batch upsert warning:', vErr.message)
      }

      if (normalized.journeys.length) {
        const { data: existingJourneys } = await supabase.from('journeys').select('id, external_id, fingerprint')
        const existingMap = new Map<string, string>()
        for (const ej of existingJourneys ?? []) {
          if (ej.external_id) existingMap.set(ej.external_id, ej.id)
          if (ej.fingerprint) existingMap.set(ej.fingerprint, ej.id)
        }

        const journeyRows = normalized.journeys.map((j) => {
          const existingId = (j.externalId ? existingMap.get(j.externalId) : undefined) ?? (j.fingerprint ? existingMap.get(j.fingerprint) : undefined)
          if (existingId) {
            j.id = existingId
            updated += 1
          } else {
            inserted += 1
          }
          return {
            id: j.id,
            external_id: j.externalId,
            fingerprint: j.fingerprint,
            source: j.source,
            vehicle_id: j.vehicleId,
            actual_start: j.actualStart,
            actual_end: j.actualEnd,
            origin: j.origin,
            destination: j.destination,
            gps_distance_km: j.gpsDistanceKm,
            source_updated_at: j.sourceUpdatedAt,
          }
        })
        const { error: jErr } = await supabase.from('journeys').upsert(journeyRows, { onConflict: 'id' })
        if (jErr) throw jErr
      }

      if (normalized.stops.length) {
        const stopRows = normalized.stops.map((stop) => ({
          journey_id: stop.journeyId,
          sequence: stop.sequence,
          arrived_at: stop.arrivedAt,
          departed_at: stop.departedAt,
          location: stop.location,
          duration_minutes: stop.durationMinutes,
        }))
        const { error: sErr } = await supabase.from('journey_stops').upsert(stopRows, { onConflict: 'journey_id,sequence' })
        if (sErr) console.warn('Stops batch upsert warning:', sErr.message)
      }

      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authorization.userId)
        let userId = isUuid ? authorization.userId : undefined
        if (!userId) {
          const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'admin').maybeSingle()
          userId = admin?.id
        }
        if (userId) {
          await supabase.from('import_batches').insert({
            provider: 'locatelia', file_name: file.name, row_count: records.length,
            accepted_count: normalized.journeys.length, rejected_count: normalized.errors.length, imported_by: userId,
          })
        }
      } catch (logErr) {
        console.warn('Import audit log warning:', logErr)
      }
    } else {
      inserted = normalized.journeys.length
    }
    return NextResponse.json({ fileName: file.name, acceptedRows: normalized.journeys.length, rejectedRows: normalized.errors.length, warnings: normalized.warnings, errors: normalized.errors.slice(0, 100), journeys: normalized.journeys, stops: normalized.stops, inserted, updated, committed: getDataMode() === 'supabase' })
  } catch (cause) {
    console.error('Import error:', cause)
    const errorMsg = cause instanceof Error ? cause.message : (typeof cause === 'object' && cause && 'message' in cause ? String(cause.message) : 'No fue posible importar el archivo.')
    return NextResponse.json({ error: errorMsg }, { status: 422 })
  }
}
