import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendEmail } from '../_shared/email.ts'

// Debe mantenerse igual a ODOMETER_GPS_TOLERANCE_KM en src/domain/journeys.ts.
const TOLERANCE_KM = 3
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? ''

interface JourneyRow {
  id: string
  origin: string | null
  destination: string | null
  actual_start: string
  actual_end: string
  gps_distance_km: number | null
  engineer_id: string
}

interface EvidenceRow {
  journey_id: string
  kind: 'before' | 'after'
  reading_km: number
}

interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
}

function isPending(journey: JourneyRow, evidence: EvidenceRow[]): boolean {
  const before = evidence.find((item) => item.kind === 'before')
  const after = evidence.find((item) => item.kind === 'after')
  if (!before || !after) return true
  if (after.reading_km < before.reading_km) return true
  if (journey.gps_distance_km === null) return false
  return Math.abs(after.reading_km - before.reading_km - journey.gps_distance_km) > TOLERANCE_KM
}

Deno.serve(async (request) => {
  if (request.headers.get('x-cron-secret') !== Deno.env.get('REMINDER_CRON_SECRET')) return new Response('Unauthorized', { status: 401 })
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const [journeys, evidence, profiles] = await Promise.all([
    client.from('journeys').select('id, origin, destination, actual_start, actual_end, gps_distance_km, engineer_id').not('actual_end', 'is', null).not('engineer_id', 'is', null),
    client.from('odometer_evidence').select('journey_id, kind, reading_km'),
    client.from('profiles').select('id, full_name, email'),
  ])
  const failure = [journeys, evidence, profiles].find((result) => result.error)
  if (failure?.error) return Response.json({ error: failure.error.message }, { status: 500 })

  const evidenceByJourney = new Map<string, EvidenceRow[]>()
  for (const row of (evidence.data ?? []) as EvidenceRow[]) {
    const bucket = evidenceByJourney.get(row.journey_id) ?? []
    bucket.push(row)
    evidenceByJourney.set(row.journey_id, bucket)
  }
  const profileById = new Map(((profiles.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))

  const pendingByEngineer = new Map<string, { email: string; name: string; trips: JourneyRow[] }>()
  for (const journey of (journeys.data ?? []) as JourneyRow[]) {
    if (!isPending(journey, evidenceByJourney.get(journey.id) ?? [])) continue
    const profile = profileById.get(journey.engineer_id)
    if (!profile?.email) continue
    const bucket = pendingByEngineer.get(journey.engineer_id) ?? { email: profile.email, name: profile.full_name ?? '', trips: [] }
    bucket.trips.push(journey)
    pendingByEngineer.set(journey.engineer_id, bucket)
  }

  let engineersNotified = 0
  for (const bucket of pendingByEngineer.values()) {
    const items = bucket.trips
      .map((trip) => `<li>${trip.origin ?? 'Origen pendiente'} → ${trip.destination ?? 'Destino pendiente'} · ${new Date(trip.actual_start).toLocaleDateString('es-MX')}</li>`)
      .join('')
    try {
      await sendEmail({
        to: bucket.email,
        subject: `Tienes ${bucket.trips.length} viaje(s) pendientes de evidencia`,
        html: `<p>Hola ${bucket.name},</p><p>Sube las fotografías de odómetro inicial y final (con su lectura en kilómetros) de estos viajes:</p><ul>${items}</ul><p><a href="${APP_URL}/mis-viajes">Ir a Mis viajes</a></p>`,
      })
      engineersNotified += 1
    } catch (cause) {
      console.error(`No fue posible notificar a ${bucket.email}:`, cause)
    }
  }

  const pendingTrips = [...pendingByEngineer.values()].reduce((total, bucket) => total + bucket.trips.length, 0)
  return Response.json({ engineersNotified, pendingTrips })
})
