import { createClient } from 'npm:@supabase/supabase-js@2'

type DatabaseClient = ReturnType<typeof createClient>
type RawRecord = Record<string, unknown>

const pick = (record: RawRecord, names: string[]) => {
  const found = Object.entries(record).find(([key]) => names.includes(key.toLowerCase().trim()))
  return String(found?.[1] ?? '').trim()
}
const iso = (value: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : undefined
const km = (value: string) => { const parsed = Number(value.replace(/[^0-9,.-]/g, '').replace(',', '.')); return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined }

export interface NormalizedTrip {
  externalId?: string
  vehicleId: string
  start: string
  end?: string
  origin?: string
  destination?: string
  distanceKm?: number
  fingerprint: string
  stops: Array<{ sequence: number; location: string; arrivedAt: string; departedAt?: string; durationMinutes: number }>
}

export async function fingerprint(parts: string[]): Promise<string> {
  const bytes = new TextEncoder().encode(parts.join('|'))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function normalizeTrips(client: DatabaseClient, payload: unknown): Promise<NormalizedTrip[]> {
  const records: RawRecord[] = Array.isArray(payload) ? payload as RawRecord[] : Array.isArray((payload as { trips?: unknown })?.trips) ? (payload as { trips: RawRecord[] }).trips : [payload as RawRecord]
  const { data: vehicles, error } = await client.from('vehicles').select('id, plate, locatelia_device_id')
  if (error) throw error
  const output: NormalizedTrip[] = []
  for (const record of records) {
    const plate = pick(record, ['placa', 'plate', 'vehicle', 'vehiculo']).replace(/\s/g, '').toUpperCase()
    const device = pick(record, ['device_id', 'device id', 'id_dispositivo', 'gps_id'])
    const vehicle = vehicles?.find((item) => item.plate.replace(/\s/g, '').toUpperCase() === plate || (device && item.locatelia_device_id === device))
    const start = iso(pick(record, ['start', 'inicio', 'fecha_inicio', 'actual_start']))
    if (!vehicle || !start) continue
    const end = iso(pick(record, ['end', 'fin', 'fecha_fin', 'actual_end']))
    const distanceKm = km(pick(record, ['distance', 'distancia', 'km', 'kilometros']))
    const externalId = pick(record, ['id', 'trip_id', 'external_id', 'folio']) || undefined
    output.push({
      externalId, vehicleId: vehicle.id, start, end, distanceKm,
      origin: pick(record, ['origin', 'origen']) || undefined, destination: pick(record, ['destination', 'destino']) || undefined,
      fingerprint: await fingerprint([vehicle.id, start, end ?? '', String(distanceKm ?? '')]), stops: [],
    })
  }
  return output
}

export async function saveTrips(client: DatabaseClient, trips: NormalizedTrip[], source: 'locatelia_api' | 'locatelia_webhook') {
  let inserted = 0; let updated = 0
  for (const trip of trips) {
    const { data: scheduled } = await client.from('journeys').select('id').eq('vehicle_id', trip.vehicleId).is('actual_start', null).lte('planned_start', trip.end ?? trip.start).gte('planned_end', trip.start).limit(2)
    let id = scheduled?.length === 1 ? scheduled[0].id : undefined
    if (!id) {
      const match = trip.externalId
        ? await client.from('journeys').select('id').eq('external_id', trip.externalId).maybeSingle()
        : await client.from('journeys').select('id').eq('fingerprint', trip.fingerprint).maybeSingle()
      id = match.data?.id
    }
    const result = await client.from('journeys').upsert({ id, external_id: trip.externalId, fingerprint: trip.externalId ? null : trip.fingerprint, source, vehicle_id: trip.vehicleId, actual_start: trip.start, actual_end: trip.end, origin: trip.origin, destination: trip.destination, gps_distance_km: trip.distanceKm, source_updated_at: new Date().toISOString() }, { onConflict: 'id' }).select('id').single()
    if (result.error) throw result.error
    if (id) updated += 1; else inserted += 1
    if (trip.stops.length) {
      const stopResult = await client.from('journey_stops').upsert(trip.stops.map((stop) => ({ journey_id: result.data.id, sequence: stop.sequence, location: stop.location, arrived_at: stop.arrivedAt, departed_at: stop.departedAt, duration_minutes: stop.durationMinutes })), { onConflict: 'journey_id,sequence' })
      if (stopResult.error) throw stopResult.error
    }
  }
  return { inserted, updated }
}
