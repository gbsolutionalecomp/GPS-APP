import type {
  Journey,
  JourneyLifecycle,
  JourneySegment,
  JourneyStop,
  JourneyWorkflow,
  OdometerEvidence,
} from './types'

export interface JourneyState {
  lifecycle: JourneyLifecycle
  workflow: JourneyWorkflow
  label: string
  tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger'
}

export const ODOMETER_GPS_TOLERANCE_KM = 3

export function evidenceForJourney(evidence: readonly OdometerEvidence[], journeyId: string) {
  return {
    before: evidence.find((item) => item.journeyId === journeyId && item.kind === 'before'),
    after: evidence.find((item) => item.journeyId === journeyId && item.kind === 'after'),
  }
}

export function calculateOdometerDelta(before?: OdometerEvidence, after?: OdometerEvidence): number | null {
  if (!before || !after || after.readingKm < before.readingKm) return null
  return Math.round((after.readingKm - before.readingKm) * 10) / 10
}

export function odometerMatchesGps(odometerKm: number | null, gpsDistanceKm: number | undefined): boolean {
  if (odometerKm === null || gpsDistanceKm === undefined) return true
  return Math.abs(odometerKm - gpsDistanceKm) <= ODOMETER_GPS_TOLERANCE_KM
}

export function getJourneyState(journey: Journey, evidence: readonly OdometerEvidence[]): JourneyState {
  const pair = evidenceForJourney(evidence, journey.id)
  if (!journey.actualStart) {
    return { lifecycle: 'scheduled', workflow: 'assigned', label: 'Programado', tone: 'info' }
  }
  if (!journey.actualEnd) {
    return { lifecycle: 'active', workflow: 'assigned', label: 'Activo', tone: 'success' }
  }
  if (!journey.projectId || !journey.engineerId) {
    return { lifecycle: 'finished', workflow: 'unassigned', label: 'Pendiente de asignación', tone: 'danger' }
  }
  if (!pair.before || !pair.after) {
    return { lifecycle: 'finished', workflow: 'pending_evidence', label: 'Pendiente de evidencia', tone: 'warning' }
  }
  if (pair.after.readingKm < pair.before.readingKm) {
    return { lifecycle: 'finished', workflow: 'pending_evidence', label: 'Lectura por corregir', tone: 'danger' }
  }
  if (!odometerMatchesGps(calculateOdometerDelta(pair.before, pair.after), journey.gpsDistanceKm)) {
    return { lifecycle: 'finished', workflow: 'pending_evidence', label: 'Odómetro no coincide con GPS', tone: 'danger' }
  }
  return { lifecycle: 'finished', workflow: 'complete', label: 'Completo', tone: 'success' }
}

export function deriveSegments(journey: Journey, allStops: readonly JourneyStop[]): JourneySegment[] {
  const stops = allStops
    .filter((stop) => stop.journeyId === journey.id)
    .sort((a, b) => a.sequence - b.sequence)
  const points = [
    { location: journey.origin || 'Origen pendiente', arrivedAt: journey.actualStart },
    ...stops.map((stop) => ({ location: stop.location, arrivedAt: stop.arrivedAt, departedAt: stop.departedAt })),
    { location: journey.destination || 'Destino pendiente', arrivedAt: journey.actualEnd },
  ]
  return points.slice(0, -1).map((point, index) => {
    const next = points[index + 1]
    return {
      id: `${journey.id}-segment-${index + 1}`,
      journeyId: journey.id,
      sequence: index + 1,
      origin: point.location,
      destination: next?.location ?? 'Destino pendiente',
      startedAt: 'departedAt' in point ? point.departedAt || point.arrivedAt : point.arrivedAt,
      endedAt: next?.arrivedAt,
    }
  })
}

export function monthKey(value: string, timeZone = 'America/Mexico_City'): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(new Date(value))
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  return `${year}-${month}`
}

export function isJourneyInMonth(journey: Journey, month: string): boolean {
  const date = journey.actualStart ?? journey.plannedStart ?? journey.createdAt
  return monthKey(date) === month
}

export function canAccessJourney(role: 'admin' | 'engineer', userId: string, journey: Journey): boolean {
  return role === 'admin' || journey.engineerId === userId
}
